import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { clinicNameForUser, privilegedClinicClient } from "@/lib/clinics/members"
import { isAccessCode } from "@/lib/patients/access-code"
import { resolveNotifyChannel } from "@/lib/patients/notify-channel"
import { sendPatientNotification } from "@/lib/patients/notify-patient"
import { toWhatsAppNumber } from "@/lib/patients/phone"
import { sendPushToTokens } from "@/lib/patients/push-send"
import { listPushTokensByPatientIds } from "@/lib/patients/push-tokens"
import { chooseReminderDelivery } from "@/lib/patients/reminder-delivery"
import { getOwnPatientRow } from "@/lib/patients/tenant"
import {
  patientAccessUrlWithCode,
  patientCheckinReminderMessage,
  patientPortalUrl,
} from "@/lib/patients/whatsapp"
import { startOfTodayIso, startOfTomorrowIso } from "@/lib/time/bucharest"

export type ManualCheckinReminderResult = {
  error: string | null
  sent: boolean
  channel: "push" | "sms" | null
}

const PATIENT_COLUMNS =
  "id, full_name, phone, access_code, token, therapist_id, assigned_therapist_id, notify_channel"
const PATIENT_COLUMNS_FALLBACK = "id, full_name, phone, access_code, token, therapist_id, assigned_therapist_id"

export async function sendManualCheckinReminder(
  supabase: SupabaseClient,
  therapistId: string,
  patientId: string,
): Promise<ManualCheckinReminderResult> {
  const owned = await getOwnPatientRow(supabase, therapistId, patientId, PATIENT_COLUMNS)
  const row = !owned.error && owned.data
    ? owned.data
    : (await getOwnPatientRow(supabase, therapistId, patientId, PATIENT_COLUMNS_FALLBACK)).data

  if (!row) {
    return { error: "Pacientul nu a fost găsit.", sent: false, channel: null }
  }

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
  const phone = typeof row.phone === "string" ? row.phone.trim() : ""
  const accessCode = typeof row.access_code === "string" ? row.access_code.trim() : ""
  const token = typeof row.token === "string" ? row.token : ""
  const hasValidPhone = Boolean(toWhatsAppNumber(phone))
  const hasAccessCode = isAccessCode(accessCode)
  const { tokensByPatient } = await listPushTokensByPatientIds(client, [patientId])
  const pushTokens = tokensByPatient.get(patientId) ?? []
  const delivery = chooseReminderDelivery({ pushTokens, hasValidPhone, hasAccessCode })

  if (delivery === "none") {
    return {
      error: "Nu pot trimite reminder: lipsește telefonul, codul de acces sau notificarea push.",
      sent: false,
      channel: null,
    }
  }

  const clinicName = (await clinicNameForUser(supabase, therapistId)) || "KinetoFlow"
  const firstName = fullName.trim().split(/\s+/)[0] || fullName
  const message = patientCheckinReminderMessage({ fullName, clinicName, accessCode })
  const portalUrl = token ? patientPortalUrl(token) : patientAccessUrlWithCode(accessCode)
  const channel = resolveNotifyChannel(row.notify_channel)

  if (delivery === "push") {
    const push = await sendPushToTokens(pushTokens, {
      title: `${clinicName}: check-in`,
      body: `Bună, ${firstName}! Nu ai făcut încă check-in-ul de azi. Deschide programul și notează cum te simți.`,
      url: portalUrl,
    })
    if (push.sent) {
      return { error: null, sent: true, channel: "push" }
    }
    if (hasValidPhone && hasAccessCode) {
      const sms = await sendPatientNotification(phone, message, "sms")
      if (sms.sent) {
        return { error: null, sent: true, channel: "sms" }
      }
      return { error: sms.error ?? "Nu am putut trimite reminder-ul.", sent: false, channel: "sms" }
    }
    return { error: push.error ?? "Nu am putut trimite notificarea push.", sent: false, channel: "push" }
  }

  const sms = await sendPatientNotification(phone, message, channel)
  if (sms.sent) {
    return { error: null, sent: true, channel: "sms" }
  }
  return { error: sms.error ?? "Nu am putut trimite reminder-ul SMS.", sent: false, channel: "sms" }
}
