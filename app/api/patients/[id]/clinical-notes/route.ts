import { NextResponse } from "next/server"

import { persistClinicalNotesForTherapist } from "@/lib/patients/persist-clinical-notes"
import { readPatientIdFromSavePayload } from "@/lib/patients/patient-id"
import { createClient } from "@/utils/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const routeParams = await context.params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: "Sesiunea a expirat. Autentifică-te din nou.", code: "unauthorized" },
      { status: 401 },
    )
  }

  let notes: unknown
  let expectedUpdatedAt: unknown
  let forceOverwrite = false
  let bodyPatientId: unknown
  let bodyPatientIdSnake: unknown
  try {
    const body = (await request.json()) as {
      notes?: unknown
      clinical_notes?: unknown
      patientId?: unknown
      patient_id?: unknown
      expectedUpdatedAt?: unknown
      forceOverwrite?: unknown
    }
    notes = body.notes ?? body.clinical_notes
    expectedUpdatedAt = body.expectedUpdatedAt
    forceOverwrite = body.forceOverwrite === true
    bodyPatientId = body.patientId
    bodyPatientIdSnake = body.patient_id
  } catch {
    return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
  }

  const patientId = readPatientIdFromSavePayload({
    patientId: bodyPatientId,
    patient_id: bodyPatientIdSnake,
    id: routeParams?.id,
  })
  if (!patientId) {
    return NextResponse.json({ error: "Pacientul nu a fost găsit." }, { status: 404 })
  }

  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Notițele trebuie să fie text." }, { status: 400 })
  }

  const result = await persistClinicalNotesForTherapist({
    supabase,
    userId: user.id,
    patientId,
    patient_id: patientId,
    notes,
    expectedUpdatedAt: typeof expectedUpdatedAt === "string" ? expectedUpdatedAt : null,
    forceOverwrite,
  })

  if (!result.ok) {
    if (result.conflict && result.current) {
      return NextResponse.json({ code: "conflict", current: result.current }, { status: 409 })
    }
    if (result.unauthorized) {
      return NextResponse.json({ error: result.error, code: "unauthorized" }, { status: 401 })
    }
    const notFound = result.error === "Pacientul nu a fost găsit."
    return NextResponse.json({ error: result.error }, { status: notFound ? 404 : 500 })
  }

  return NextResponse.json({ ok: true, updated_at: result.updated_at })
}
