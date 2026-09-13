import type { SupabaseClient } from "@supabase/supabase-js"

import { readPatientRecordId } from "./patient-id.ts"
import type { CheckInRecord } from "./types-db.ts"

const CHECK_IN_COLUMNS =
  "id, patient_id, vas_score, sleep_quality, pain_type, notes, created_at, exercise_duration_seconds"
const CHECK_IN_COLUMNS_NO_DURATION =
  "id, patient_id, vas_score, sleep_quality, pain_type, notes, created_at"

/** Istoric pe fișă: destul pentru grafic, fără tot arhiva. */
export const PATIENT_FILE_CHECKIN_LIMIT = 90
/** Dashboard: VAS + frecvență pe ultimele 30 de zile. */
export const DASHBOARD_VAS_DAYS = 30
export const DASHBOARD_VAS_POINT_LIMIT = 800

export function mapCheckInRow(row: Record<string, unknown>): CheckInRecord {
  const duration = row.exercise_duration_seconds
  return {
    id: String(row.id),
    patient_id: String(row.patient_id),
    vas_score: Number(row.vas_score),
    sleep_quality: typeof row.sleep_quality === "string" ? row.sleep_quality : null,
    pain_type: typeof row.pain_type === "string" ? row.pain_type : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    created_at: String(row.created_at),
    exercise_duration_seconds:
      typeof duration === "number" && Number.isFinite(duration) ? duration : null,
  }
}

/**
 * Istoric de monitorizare: doar `patient_id` (UUID din URL / fișă).
 * Fără `therapist_id` / `user_id` — toți terapeuții din cabinet văd aceleași check-in-uri.
 */
export async function listCheckInsForPatient(
  supabase: SupabaseClient,
  patientId: string,
): Promise<CheckInRecord[]> {
  const id = readPatientRecordId(patientId)
  if (!id) {
    return []
  }

  const withDuration = await supabase
    .from("check_ins")
    .select(CHECK_IN_COLUMNS)
    .eq("patient_id", id)
    .order("created_at", { ascending: false })
    .limit(PATIENT_FILE_CHECKIN_LIMIT)

  if (!withDuration.error) {
    return ((withDuration.data ?? []) as Record<string, unknown>[]).map(mapCheckInRow)
  }

  const missingDuration =
    withDuration.error.code === "PGRST204" ||
    withDuration.error.message.toLowerCase().includes("exercise_duration_seconds")

  if (!missingDuration) {
    console.error("[check_ins] list by patient_id", withDuration.error.message)
    return []
  }

  const fallback = await supabase
    .from("check_ins")
    .select(CHECK_IN_COLUMNS_NO_DURATION)
    .eq("patient_id", id)
    .order("created_at", { ascending: false })
    .limit(PATIENT_FILE_CHECKIN_LIMIT)

  if (fallback.error) {
    console.error("[check_ins] list by patient_id", fallback.error.message)
    return []
  }

  return ((fallback.data ?? []) as Record<string, unknown>[]).map(mapCheckInRow)
}

/** Puncte VAS pentru lista de dashboard: tot doar după `patient_id`. */
export async function listVasPointsForPatients(
  supabase: SupabaseClient,
  patientIds: string[],
  options?: { since?: string; limit?: number },
): Promise<Array<Pick<CheckInRecord, "patient_id" | "vas_score" | "created_at">>> {
  const ids = patientIds.map((value) => readPatientRecordId(value)).filter((id): id is string => Boolean(id))
  if (ids.length === 0) {
    return []
  }

  let query = supabase
    .from("check_ins")
    .select("patient_id, vas_score, created_at")
    .in("patient_id", ids)
    .order("created_at", { ascending: false })
  if (options?.since) {
    query = query.gte("created_at", options.since)
  }
  if (options?.limit && options.limit > 0) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query

  if (error) {
    console.error("[check_ins] list VAS by patient_id", error.message)
    return []
  }

  return (data ?? []) as Array<Pick<CheckInRecord, "patient_id" | "vas_score" | "created_at">>
}
