import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { clinicNameForUser, privilegedClinicClient } from "@/lib/clinics/members"
import { sendPushToTokens } from "@/lib/patients/push-send"
import { listPushTokensByPatientIds } from "@/lib/patients/push-tokens"
import { chooseReminderDelivery } from "@/lib/patients/reminder-delivery"
import { getOwnPatientRow } from "@/lib/patients/tenant"
import { patientAccessUrlWithCode, patientPortalUrl } from "@/lib/patients/whatsapp"
import { startOfTodayIso, startOfTomorrowIso } from "@/lib/time/bucharest"

export type ManualCheckinReminderResult = {
  error: string | null
  sent: boolean
  channel: "push" | null
}

const PATIENT_COLUMNS = "id, full_name, access_code, token, therapist_id, assigned_therapist_id"

export async function sendManualCheckinReminder(
  supabase: SupabaseClient,
  therapistId: string,
  patientId: string,
): Promise<ManualCheckinReminderResult> {
  const owned = await getOwnPatientRow(supabase, therapistId, patientId, PATIENT_COLUMNS)

  if (!owned.data) {
    return { error: "Pacientul nu a fost găsit.", sent: false, channel: null }
  }

  const row = owned.data
  const client = await privilegedClinicClient(supabase)
  const todayStart = startOfTodayIso()
  const tomorrowStart = startOfTomorrowIso()
  const { data: todayRows, error: checkInError } = await client
    .from("check_ins")
    .select("id")
    .eq("patient_id", patientId)
    .gte("created_at", todayStart)
    .lt("created_at", tomorrowStart)
    .limit(1)

  if (checkInError) {
    return { error: checkInError.message, sent: false, channel: null }
  }
  if ((todayRows ?? []).length > 0) {
    return { error: "Pacientul a completat deja check-in-ul de azi.", sent: false, channel: null }
  }

  const fullName = String(row.full_name ?? "")
  const accessCode = typeof row.access_code === "string" ? row.access_code.trim() : ""
  const token = typeof row.token === "string" ? row.token : ""
  const { tokensByPatient } = await listPushTokensByPatientIds(client, [patientId])
  const pushTokens = tokensByPatient.get(patientId) ?? []
  const delivery = chooseReminderDelivery({ pushTokens })

  if (delivery === "none") {
    return {
      error: "Pacientul nu a activat notificările push.",
      sent: false,
      channel: null,
    }
  }

  const clinicName = (await clinicNameForUser(supabase, therapistId)) || "KinetoFlow"
  const firstName = fullName.trim().split(/\s+/)[0] || fullName
  const portalUrl = token ? patientPortalUrl(token) : patientAccessUrlWithCode(accessCode)

  try {
    const push = await sendPushToTokens(pushTokens, {
      title: `${clinicName}: check-in`,
      body: `Bună, ${firstName}! Nu ai făcut încă check-in-ul de azi. Deschide programul și notează cum te simți.`,
      url: portalUrl,
    })
    if (push.sent) {
      return { error: null, sent: true, channel: "push" }
    }
    return { error: push.error ?? "Nu am putut trimite notificarea push.", sent: false, channel: "push" }
  } catch {
    return {
      error: "Notificările push nu sunt disponibile momentan.",
      sent: false,
      channel: null,
    }
  }
}
