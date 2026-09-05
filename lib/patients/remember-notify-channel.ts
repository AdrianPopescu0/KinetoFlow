import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { PatientNotifyChannel } from "@/lib/patients/notify-channel"

function isMissingNotifyChannel(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST204" ||
    (message.includes("notify_channel") &&
      (message.includes("could not find") || message.includes("schema cache") || message.includes("does not exist")))
  )
}

export async function rememberPatientNotifyChannel(
  client: SupabaseClient,
  patientId: string,
  channel: PatientNotifyChannel,
): Promise<{ saved: boolean; missingColumn?: boolean; error?: string }> {
  const update = await client.from("patients").update({ notify_channel: channel }).eq("id", patientId)
  if (!update.error) {
    return { saved: true }
  }
  if (isMissingNotifyChannel(update.error)) {
    return { saved: false, missingColumn: true }
  }
  return { saved: false, error: update.error.message }
}

export function isMissingNotifyChannelColumn(error: { message?: string; code?: string } | null): boolean {
  return isMissingNotifyChannel(error)
}
