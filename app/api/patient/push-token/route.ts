import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { upsertPatientPushToken } from "@/lib/patients/push-tokens"
import { isPatientUuidToken, PATIENT_SESSION_COOKIE } from "@/lib/patients/session"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type Body = {
  token?: unknown
  fcmToken?: unknown
}

/**
 * Portal pacient: salvează tokenul FCM pentru reminder-ele de check-in.
 * Auth = token UUID al programului (același din /patient/[token]).
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
  }

  const portalToken = typeof body.token === "string" ? body.token.trim() : ""
  const fcmToken = typeof body.fcmToken === "string" ? body.fcmToken.trim() : ""

  if (!isPatientUuidToken(portalToken) || fcmToken.length < 20) {
    return NextResponse.json({ error: "Cerere invalidă (token sau FCM)." }, { status: 400 })
  }
  if (fcmToken.startsWith("mock-web:") && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Token FCM invalid." }, { status: 400 })
  }

  const jar = await cookies()
  const cookieToken = jar.get(PATIENT_SESSION_COOKIE)?.value?.trim()
  if (cookieToken && isPatientUuidToken(cookieToken) && cookieToken !== portalToken) {
    return NextResponse.json({ error: "Sesiunea nu corespunde programului." }, { status: 403 })
  }

  try {
    const admin = createServiceRoleClient()
    const { data: patient, error: patientError } = await admin
      .from("patients")
      .select("id")
      .eq("token", portalToken)
      .maybeSingle()

    if (patientError || !patient?.id) {
      return NextResponse.json({ error: "Programul pacientului nu a fost găsit." }, { status: 404 })
    }

    const userAgent = request.headers.get("user-agent")
    const result = await upsertPatientPushToken(admin, {
      patientId: patient.id,
      token: fcmToken,
      userAgent,
    })

    if (result.missingTable) {
      return NextResponse.json(
        { error: "Tabela patient_push_tokens lipsește. Rulează sql/023_patient_push_tokens.sql." },
        { status: 503 },
      )
    }
    if (!result.saved) {
      return NextResponse.json({ error: result.error ?? "Nu am putut salva tokenul." }, { status: 500 })
    }

    return NextResponse.json({ ok: true, patientId: patient.id })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[push-token]", message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
