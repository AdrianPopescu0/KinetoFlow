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

/** Filtrează pacienții cabinetului curent (user_id, cu fallback pe therapist_id). */
export async function selectOwnPatients<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns: string,
): Promise<{ data: T[] | null; error: { message: string; code?: string } | null }> {
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

export async function getOwnPatientRow(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
  columns: string,
): Promise<{ data: Record<string, unknown> | null; error: { message: string; code?: string } | null }> {
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

export function patientTenantPayload(userId: string) {
  return {
    user_id: userId,
    therapist_id: userId,
  }
}
