import type { SupabaseClient } from "@supabase/supabase-js"

import { isEnergyLevel, isSleepQuality, type DailyCheckin, type SleepQuality } from "./types.ts"
import { bucharestDateKey, startOfTodayIso, startOfTomorrowIso } from "../time/bucharest.ts"

export const CHECKIN_ALREADY_SUBMITTED_MESSAGE =
  "Ai trimis deja check-in-ul de azi. Păstrăm prima evaluare, cea valabilă."

const CHECKIN_SELECT =
  "id, vas_score, sleep_quality, pain_type, notes, energy_level, exercise_duration_seconds, created_at, local_date"
const CHECKIN_SELECT_WITHOUT_LOCAL_DATE =
  "id, vas_score, sleep_quality, pain_type, notes, energy_level, exercise_duration_seconds, created_at"

export function isUniqueCheckinConstraintError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false
  }
  const code = (error.code ?? "").toLowerCase()
  const message = (error.message ?? "").toLowerCase()
  return (
    code === "23505" ||
    message.includes("check_ins_patient_local_date") ||
    (message.includes("duplicate") && message.includes("check_ins"))
  )
}

function isMissingColumnError(error: { code?: string; message?: string }, column: string): boolean {
  const message = (error.message ?? "").toLowerCase()
  return error.code === "PGRST204" || message.includes(column.toLowerCase())
}

function sleepFromRow(value: unknown): SleepQuality {
  return typeof value === "string" && isSleepQuality(value) ? value : "moderat"
}

export function dailyCheckinFromRow(
  row: Record<string, unknown>,
  localDate: string,
  completedExerciseIds: string[] = [],
): DailyCheckin {
  const energyRaw = row.energy_level
  const duration = row.exercise_duration_seconds
  const createdAt = typeof row.created_at === "string" ? row.created_at : new Date().toISOString()
  const rowDate = typeof row.local_date === "string" && row.local_date.length >= 10 ? row.local_date.slice(0, 10) : localDate

  return {
    submittedAt: createdAt,
    localDate: rowDate,
    pain: typeof row.vas_score === "number" ? row.vas_score : Number(row.vas_score) || 0,
    sleep: sleepFromRow(row.sleep_quality),
    painKind: null,
    energy: typeof energyRaw === "string" && isEnergyLevel(energyRaw) ? energyRaw : null,
    notes: typeof row.notes === "string" ? row.notes : "",
    completedExerciseIds,
    exerciseDurationSeconds: typeof duration === "number" ? duration : null,
  }
}

export async function fetchTodaysCheckInRow(
  supabase: SupabaseClient,
  patientId: string,
  localDate = bucharestDateKey(),
): Promise<Record<string, unknown> | null> {
  const byDate = await supabase
    .from("check_ins")
    .select(CHECKIN_SELECT)
    .eq("patient_id", patientId)
    .eq("local_date", localDate)
    .order("created_at", { ascending: true })
    .limit(1)

  if (!byDate.error) {
    return (byDate.data?.[0] as Record<string, unknown> | undefined) ?? null
  }

  if (!isMissingColumnError(byDate.error, "local_date") && !isMissingColumnError(byDate.error, "energy_level")) {
    return null
  }

  const fallback = await supabase
    .from("check_ins")
    .select(CHECKIN_SELECT_WITHOUT_LOCAL_DATE)
    .eq("patient_id", patientId)
    .gte("created_at", startOfTodayIso())
    .lt("created_at", startOfTomorrowIso())
    .order("created_at", { ascending: true })
    .limit(1)

  if (fallback.error) {
    const core = await supabase
      .from("check_ins")
      .select("id, vas_score, sleep_quality, pain_type, notes, created_at")
      .eq("patient_id", patientId)
      .gte("created_at", startOfTodayIso())
      .lt("created_at", startOfTomorrowIso())
      .order("created_at", { ascending: true })
      .limit(1)
    return (core.data?.[0] as Record<string, unknown> | undefined) ?? null
  }

  return (fallback.data?.[0] as Record<string, unknown> | undefined) ?? null
}
