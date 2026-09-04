import { NextResponse } from "next/server"

import { createClient } from "@/utils/supabase/server"
import { clinicNameForUser } from "@/lib/clinics/members"
import {
  patientAccessUrl,
  patientWhatsAppHref,
  patientWhatsAppMessage,
  patientWhatsAppWebHref,
} from "@/lib/patients/whatsapp"
import { sendWhatsAppMessage } from "@/lib/patients/whatsapp-send"
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

  const result = await sendWhatsAppMessage(phone, message)

  return NextResponse.json({
    sent: result.sent,
    fallback: "click-to-chat",
    portalUrl: patientAccessUrl(),
    whatsappHref,
    whatsappWebHref,
    whatsappMessage: message,
  })
}
