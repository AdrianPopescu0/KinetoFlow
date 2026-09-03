import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { clinicNameForUser } from "@/lib/clinics/members"
import {
  patientAccessUrl,
  patientWhatsAppHref,
  patientWhatsAppMessage,
  patientWhatsAppWebHref,
} from "@/lib/patients/whatsapp"
import { toWhatsAppNumber } from "@/lib/patients/phone"
import { getOwnPatientRow } from "@/lib/patients/tenant"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Neautorizat.", sent: false }, { status: 401 })
  }

  let patientId: unknown
  try {
    const body = (await request.json()) as { patientId?: unknown }
    patientId = body.patientId
  } catch {
    return NextResponse.json({ error: "Payload invalid.", sent: false }, { status: 400 })
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
  const whatsappHref = phone ? patientWhatsAppHref(phone, message) : null
  const whatsappWebHref = phone ? patientWhatsAppWebHref(phone, message) : null

  const sent = await sendViaProvider(phone, message)

  return NextResponse.json({
    sent,
    fallback: "click-to-chat",
    portalUrl: patientAccessUrl(),
    whatsappHref,
    whatsappWebHref,
    whatsappMessage: message,
  })
}

async function sendViaProvider(phone: string, message: string): Promise<boolean> {
  const to = toWhatsAppNumber(phone)
  if (!to) {
    return false
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
      const body = new URLSearchParams({
        From: twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`,
        To: `whatsapp:+${to}`,
        Body: message,
      })
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      })
      return response.ok
    } catch {
      return false
    }
  }

  const metaToken = process.env.WHATSAPP_CLOUD_TOKEN
  const metaPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      })
      return response.ok
    } catch {
      return false
    }
  }

  return false
}
