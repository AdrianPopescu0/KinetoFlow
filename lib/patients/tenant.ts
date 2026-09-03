import type { SupabaseClient } from "@supabase/supabase-js"

import { listClinicMemberUserIds, privilegedClinicClient } from "@/lib/clinics/members"

function isMissingColumn(error: { message?: string; code?: string } | null, column: string): boolean {
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

/** Pacienții cabinetului: `therapist_id` / `assigned_therapist_id` ∈ membrii cu același `clinic_name`. */
export async function selectOwnPatients<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns: string,
  _unused?: string,
): Promise<{ data: T[] | null; error: { message: string; code?: string } | null }> {
  const memberIds = await listClinicMemberUserIds(supabase, userId)
  const client = await privilegedClinicClient(supabase)

  const idList = memberIds.join(",")
  const byTherapist = await client
    .from("patients")
    .select(columns)
    .or(`therapist_id.in.(${idList}),assigned_therapist_id.in.(${idList})`)
    .order("created_at", { ascending: false })

  if (!byTherapist.error) {
    return { data: (byTherapist.data as T[] | null) ?? [], error: null }
  }

  if (isMissingColumn(byTherapist.error, "assigned_therapist_id")) {
    const legacy = await client
      .from("patients")
      .select(columns)
      .in("therapist_id", memberIds)
      .order("created_at", { ascending: false })
    if (!legacy.error) {
      return { data: (legacy.data as T[] | null) ?? [], error: null }
    }
    return { data: null, error: legacy.error }
  }

  return { data: null, error: byTherapist.error }
}

export async function getOwnPatientRow(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
  columns: string,
  _unused?: string,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const memberIds = await listClinicMemberUserIds(supabase, userId)
  const client = await privilegedClinicClient(supabase)

  const idList = memberIds.join(",")
  const byTherapist = await client
    .from("patients")
    .select(columns)
    .eq("id", patientId)
    .or(`therapist_id.in.(${idList}),assigned_therapist_id.in.(${idList})`)
    .maybeSingle()

  if (!byTherapist.error) {
    return { data: (byTherapist.data as Record<string, unknown> | null) ?? null, error: null }
  }

  if (isMissingColumn(byTherapist.error, "assigned_therapist_id")) {
    const legacy = await client
      .from("patients")
      .select(columns)
      .eq("id", patientId)
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
