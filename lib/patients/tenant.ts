import type { SupabaseClient } from "@supabase/supabase-js"

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

/** Filtrează pacienții cabinetului curent (clinic_id, apoi user_id / therapist_id). */
export async function selectOwnPatients<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns: string,
  clinicId: string = userId,
): Promise<{ data: T[] | null; error: { message: string; code?: string } | null }> {
  const byClinic = await supabase
    .from("patients")
    .select(columns)
    .eq("clinic_id", clinicId)
    .order("created_at", { ascending: false })
  if (!byClinic.error) {
    return { data: (byClinic.data as T[] | null) ?? [], error: null }
  }
  if (isMissingColumn(byClinic.error, "clinic_id")) {
    const byUserId = await supabase
      .from("patients")
      .select(columns)
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
    if (!byUserId.error) {
      return { data: (byUserId.data as T[] | null) ?? [], error: null }
    }
    if (isMissingColumn(byUserId.error, "user_id")) {
      const fallback = await supabase
        .from("patients")
        .select(columns)
        .eq("therapist_id", userId)
        .order("created_at", { ascending: false })
      return {
        data: (fallback.data as T[] | null) ?? [],
        error: fallback.error,
      }
    }
    return { data: null, error: byUserId.error }
  }
  return { data: null, error: byClinic.error }
}

export async function getOwnPatientRow(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
  columns: string,
  clinicId: string = userId,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
  const byClinic = await supabase
    .from("patients")
    .select(columns)
    .eq("id", patientId)
    .eq("clinic_id", clinicId)
    .maybeSingle()

  if (!byClinic.error) {
    return { data: (byClinic.data as Record<string, unknown> | null) ?? null, error: null }
  }

  if (isMissingColumn(byClinic.error, "clinic_id")) {
    const byUserId = await supabase
      .from("patients")
      .select(columns)
      .eq("id", patientId)
      .eq("user_id", userId)
      .maybeSingle()

    if (!byUserId.error) {
      return { data: (byUserId.data as Record<string, unknown> | null) ?? null, error: null }
    }

    if (isMissingColumn(byUserId.error, "user_id")) {
      const fallback = await supabase
        .from("patients")
        .select(columns)
        .eq("id", patientId)
        .eq("therapist_id", userId)
        .maybeSingle()
      return {
        data: (fallback.data as Record<string, unknown> | null) ?? null,
        error: fallback.error,
      }
    }
    return { data: null, error: byUserId.error }
  }

  return { data: null, error: byClinic.error }
}

export function patientTenantPayload(userId: string, clinicId: string = userId) {
  return {
    user_id: userId,
    therapist_id: userId,
    clinic_id: clinicId,
    assigned_therapist_id: userId,
  }
}
