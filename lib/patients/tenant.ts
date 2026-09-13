import type { SupabaseClient } from "@supabase/supabase-js"

import { listClinicMemberUserIds, privilegedClinicClient } from "@/lib/clinics/members"

import { readPatientRecordId } from "@/lib/patients/patient-id"

export type PatientArchiveFilter = "active" | "archived" | "all"

export function isMissingColumn(error: { message?: string; code?: string } | null, column: string): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST204" ||
    (message.includes(column.toLowerCase()) &&
      (message.includes("could not find") || message.includes("schema cache") || message.includes("does not exist")))
  )
}

function columnsWithoutArchivedAt(columns: string): string {
  return columns
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part !== "archived_at")
    .join(", ")
}

/** Pacienții cabinetului: `therapist_id` / `assigned_therapist_id` ∈ membrii cu același `clinic_name`. */
export async function selectOwnPatients<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns: string,
  options?: { limit?: number; archived?: PatientArchiveFilter },
): Promise<{ data: T[] | null; error: { message: string; code?: string } | null }> {
  const memberIds = await listClinicMemberUserIds(supabase, userId)
  const client = await privilegedClinicClient(supabase)
  const limit = options?.limit && options.limit > 0 ? options.limit : 200
  const archived = options?.archived ?? "active"
  const idList = memberIds.join(",")

  const run = async (selectColumns: string, withAssigned: boolean, applyArchive: boolean) => {
    let query = client.from("patients").select(selectColumns)
    if (withAssigned) {
      query = query.or(`therapist_id.in.(${idList}),assigned_therapist_id.in.(${idList})`)
    } else {
      query = query.in("therapist_id", memberIds)
    }
    if (applyArchive && archived === "active") {
      query = query.is("archived_at", null)
    } else if (applyArchive && archived === "archived") {
      query = query.not("archived_at", "is", null)
    }
    return query.order("created_at", { ascending: false }).limit(limit)
  }

  const first = await run(columns, true, archived !== "all")
  if (!first.error) {
    return { data: (first.data as T[] | null) ?? [], error: null }
  }

  if (isMissingColumn(first.error, "archived_at") && archived !== "all") {
    if (archived === "archived") {
      return { data: [], error: null }
    }
    const withoutArchive = columnsWithoutArchivedAt(columns)
    const retry = await run(withoutArchive, true, false)
    if (!retry.error) {
      return { data: (retry.data as T[] | null) ?? [], error: null }
    }
    if (isMissingColumn(retry.error, "assigned_therapist_id")) {
      const legacy = await run(withoutArchive, false, false)
      if (!legacy.error) {
        return { data: (legacy.data as T[] | null) ?? [], error: null }
      }
      return { data: null, error: legacy.error }
    }
    return { data: null, error: retry.error }
  }

  if (isMissingColumn(first.error, "assigned_therapist_id")) {
    const legacy = await run(columns, false, archived !== "all")
    if (!legacy.error) {
      return { data: (legacy.data as T[] | null) ?? [], error: null }
    }
    if (isMissingColumn(legacy.error, "archived_at") && archived !== "all") {
      if (archived === "archived") {
        return { data: [], error: null }
      }
      const withoutArchive = columnsWithoutArchivedAt(columns)
      const retry = await run(withoutArchive, false, false)
      if (!retry.error) {
        return { data: (retry.data as T[] | null) ?? [], error: null }
      }
      return { data: null, error: retry.error }
    }
    return { data: null, error: legacy.error }
  }

  return { data: null, error: first.error }
}

export async function getOwnPatientRow(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
  columns: string,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const resolvedId = readPatientRecordId(patientId)
  if (!resolvedId) {
    return { data: null, error: { message: "Pacientul nu a fost găsit." } }
  }

  const memberIds = await listClinicMemberUserIds(supabase, userId)
  const client = await privilegedClinicClient(supabase)

  const idList = memberIds.join(",")
  const byTherapist = await client
    .from("patients")
    .select(columns)
    .eq("id", resolvedId)
    .or(`therapist_id.in.(${idList}),assigned_therapist_id.in.(${idList})`)
    .maybeSingle()

  if (!byTherapist.error) {
    return { data: (byTherapist.data as Record<string, unknown> | null) ?? null, error: null }
  }

  if (isMissingColumn(byTherapist.error, "assigned_therapist_id")) {
    const legacy = await client
      .from("patients")
      .select(columns)
      .eq("id", resolvedId)
      .in("therapist_id", memberIds)
      .maybeSingle()
    if (!legacy.error) {
      return { data: (legacy.data as Record<string, unknown> | null) ?? null, error: null }
    }
    return { data: null, error: legacy.error }
  }

  return { data: null, error: byTherapist.error }
}

export function patientTenantPayload(userId: string) {
  return {
    therapist_id: userId,
    assigned_therapist_id: userId,
  }
}
