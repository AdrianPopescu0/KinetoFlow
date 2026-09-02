import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { patientPortalUrl, patientWhatsAppHref, patientWhatsAppMessage } from "@/lib/patients/whatsapp"
import { toWhatsAppNumber } from "@/lib/patients/phone"

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

  const { data: patient, error } = await supabase
    .from("patients")
    .select("id, full_name, phone, token, access_code")
    .eq("id", patientId)
    .maybeSingle()

  if (error || !patient) {
    return NextResponse.json({ error: "Pacientul nu a fost găsit.", sent: false }, { status: 404 })
  }

  const accessCode = typeof patient.access_code === "string" ? patient.access_code : ""
  const phone = typeof patient.phone === "string" ? patient.phone : ""
  const token = String(patient.token)
  const fullName = String(patient.full_name)
  const message = patientWhatsAppMessage({ fullName, token, accessCode })
  const whatsappHref = phone ? patientWhatsAppHref(phone, message) : null

  const sent = await sendViaProvider(phone, message)

  return NextResponse.json({
    sent,
    fallback: "click-to-chat",
    portalUrl: patientPortalUrl(token),
    whatsappHref,
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
