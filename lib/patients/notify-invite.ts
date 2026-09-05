import "server-only"

import { NextResponse } from "next/server"

import { clinicNameForUser } from "@/lib/clinics/members"
import { parseNotifyChannel, type PatientNotifyChannel } from "@/lib/patients/notify-channel"
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
  try {
    const body = (await request.json()) as { patientId?: unknown; channel?: unknown }
    patientId = body.patientId
    channelRaw = body.channel
  } catch {
    return NextResponse.json({ error: "Payload invalid.", sent: false }, { status: 400 })
  }

  const channel = forcedChannel ?? parseNotifyChannel(channelRaw)
  if (!channel) {
    return NextResponse.json({ error: "Alege WhatsApp sau SMS.", sent: false }, { status: 400 })
  }

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

  const remembered = await rememberPatientNotifyChannel(supabase, patientId, channel)
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
