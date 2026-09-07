import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

export type PushTokenRow = {
  patient_id: string
  token: string
}

export function isMissingPushTokensTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (message.includes("patient_push_tokens") &&
      (message.includes("does not exist") ||
        message.includes("could not find") ||
        message.includes("schema cache")))
  )
}

export async function listPushTokensByPatientIds(
  supabase: SupabaseClient,
  patientIds: string[],
): Promise<{ tokensByPatient: Map<string, string[]>; missingTable: boolean }> {
  const tokensByPatient = new Map<string, string[]>()
  if (patientIds.length === 0) {
    return { tokensByPatient, missingTable: false }
  }

  const { data, error } = await supabase
    .from("patient_push_tokens")
    .select("patient_id, token")
    .in("patient_id", patientIds)

  if (error) {
    if (isMissingPushTokensTable(error)) {
      return { tokensByPatient, missingTable: true }
    }
    throw new Error(`Nu am putut citi tokenurile push: ${error.message}`)
  }

  for (const row of (data ?? []) as PushTokenRow[]) {
    if (!row.patient_id || !row.token) {
      continue
    }
    const list = tokensByPatient.get(row.patient_id) ?? []
    list.push(row.token)
    tokensByPatient.set(row.patient_id, list)
  }

  return { tokensByPatient, missingTable: false }
}

export async function upsertPatientPushToken(
  supabase: SupabaseClient,
  input: { patientId: string; token: string; userAgent?: string | null },
): Promise<{ saved: boolean; missingTable?: boolean; error?: string }> {
  const now = new Date().toISOString()
  const { error } = await supabase.from("patient_push_tokens").upsert(
    {
      patient_id: input.patientId,
      token: input.token,
      platform: "web",
      user_agent: input.userAgent?.slice(0, 240) ?? null,
      updated_at: now,
    },
    { onConflict: "token" },
  )

  if (!error) {
    return { saved: true }
  }
  if (isMissingPushTokensTable(error)) {
    return { saved: false, missingTable: true }
  }
  return { saved: false, error: error.message }
}

export async function deletePatientPushTokens(
  supabase: SupabaseClient,
  tokens: string[],
): Promise<void> {
  if (tokens.length === 0) {
    return
  }
  await supabase.from("patient_push_tokens").delete().in("token", tokens)
}
