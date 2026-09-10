import "server-only"

import { NextResponse } from "next/server"

import { clinicNameForUser } from "@/lib/clinics/members"
import {
  DEFAULT_NOTIFY_CHANNEL,
  parseNotifyChannel,
  resolveNotifyChannel,
  type PatientNotifyChannel,
} from "@/lib/patients/notify-channel"
import { sendPatientNotification } from "@/lib/patients/notify-patient"
import { rememberPatientNotifyChannel } from "@/lib/patients/remember-notify-channel"
import { getOwnPatientRow } from "@/lib/patients/tenant"
import {
  patientAccessUrl,
  patientWhatsAppHref,
  patientWhatsAppMessage,
  patientWhatsAppWebHref,
} from "@/lib/patients/whatsapp"
import { createClient } from "@/utils/supabase/server"

export async function handlePatientInviteNotify(
  request: Request,
  forcedChannel?: PatientNotifyChannel,
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat.", sent: false }, { status: 401 })
  }

  let patientId: unknown
  let channelRaw: unknown
  let rememberOnly = false
  try {
    const body = (await request.json()) as {
      patientId?: unknown
      channel?: unknown
      rememberOnly?: unknown
    }
    patientId = body.patientId
    channelRaw = body.channel
    rememberOnly = body.rememberOnly === true
  } catch {
    return NextResponse.json({ error: "Payload invalid.", sent: false }, { status: 400 })
  }

  const storedChannel =
    parseNotifyChannel(forcedChannel ?? channelRaw) ?? DEFAULT_NOTIFY_CHANNEL
  const channel = rememberOnly ? storedChannel : resolveNotifyChannel(forcedChannel ?? channelRaw)

  if (typeof patientId !== "string" || patientId.length < 8) {
    return NextResponse.json({ error: "Lipsește pacientul.", sent: false }, { status: 400 })
  }

  const resolved = await getOwnPatientRow(
    supabase,
    user.id,
    patientId,
    "id, full_name, phone, access_code",
  )

  if (resolved.error || !resolved.data) {
    return NextResponse.json({ error: "Pacientul nu a fost găsit.", sent: false }, { status: 404 })
  }

  const found = resolved.data
  const accessCode = typeof found.access_code === "string" ? found.access_code : ""
  const phone = typeof found.phone === "string" ? found.phone : ""
  const fullName = String(found.full_name)
  const clinicName = (await clinicNameForUser(supabase, user.id)) || "KinetoFlow"
  const message = patientWhatsAppMessage({ fullName, clinicName, accessCode })

  const remembered = await rememberPatientNotifyChannel(supabase, patientId, storedChannel)

  if (rememberOnly) {
    return NextResponse.json({
      sent: false,
      channel: storedChannel,
      provider: null,
      saved: remembered.saved,
      missingColumn: remembered.missingColumn ?? false,
      error: remembered.error ?? null,
      portalUrl: patientAccessUrl(),
      whatsappHref: phone ? patientWhatsAppHref(phone, message) : null,
      whatsappWebHref: phone ? patientWhatsAppWebHref(phone, message) : null,
      message,
      whatsappMessage: message,
    })
  }

  const result = phone
    ? await sendPatientNotification(phone, message, channel)
    : { sent: false, channel, provider: null, error: "Lipsește telefonul." }

  return NextResponse.json({
    sent: result.sent,
    channel,
    provider: result.provider,
    saved: remembered.saved,
    missingColumn: remembered.missingColumn ?? false,
    error: result.sent ? null : (result.error ?? remembered.error ?? null),
    portalUrl: patientAccessUrl(),
    whatsappHref: phone ? patientWhatsAppHref(phone, message) : null,
    whatsappWebHref: phone ? patientWhatsAppWebHref(phone, message) : null,
    message,
    whatsappMessage: message,
  })
}
