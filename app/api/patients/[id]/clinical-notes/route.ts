import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { listClinicMemberUserIds, privilegedClinicClient } from "@/lib/clinics/members"
import { clinicIdFromUser } from "@/lib/clinics/profile"
import { fetchPatientFileSnapshot, isWriteConflict } from "@/lib/patients/optimistic"
import { createClient } from "@/utils/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id: patientId } = await context.params

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
  try {
    const body = (await request.json()) as {
      notes?: unknown
      clinical_notes?: unknown
      expectedUpdatedAt?: unknown
      forceOverwrite?: unknown
    }
    notes = body.notes ?? body.clinical_notes
    expectedUpdatedAt = body.expectedUpdatedAt
    forceOverwrite = body.forceOverwrite === true
  } catch {
    return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
  }

  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Notițele trebuie să fie text." }, { status: 400 })
  }

  const clinicId = clinicIdFromUser(user)
  const snapshot = await fetchPatientFileSnapshot(supabase, user.id, patientId, clinicId)
  if (!snapshot) {
    return NextResponse.json({ error: "Pacientul nu a fost găsit." }, { status: 404 })
  }

  const expected = typeof expectedUpdatedAt === "string" ? expectedUpdatedAt : null
  if (!forceOverwrite && isWriteConflict(expected, snapshot.updated_at)) {
    return NextResponse.json({ code: "conflict", current: snapshot }, { status: 409 })
  }

  const trimmed = notes.trim().length > 0 ? notes : null
  const memberIds = await listClinicMemberUserIds(supabase, user.id)
  const client = await privilegedClinicClient(supabase)

  let update = client
    .from("patients")
    .update({ clinical_notes: trimmed })
    .eq("id", patientId)
    .in("therapist_id", memberIds)

  if (!forceOverwrite && expected && snapshot.updated_at) {
    update = update.eq("updated_at", snapshot.updated_at)
  }

  const { data, error } = await update.select("id, updated_at")

  if (error || !data || data.length === 0) {
    if (!forceOverwrite && expected) {
      const latest = await fetchPatientFileSnapshot(supabase, user.id, patientId, clinicId)
      if (latest && isWriteConflict(expected, latest.updated_at)) {
        return NextResponse.json({ code: "conflict", current: latest }, { status: 409 })
      }
    }

    const fallback = await client
      .from("patients")
      .update({ clinical_notes: trimmed })
      .eq("id", patientId)
      .in("therapist_id", memberIds)
      .select("id, updated_at")

    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    }
    if (!fallback.data || fallback.data.length === 0) {
      return NextResponse.json({ error: "Nu am putut salva notițele." }, { status: 500 })
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/patients/${patientId}`)
    return NextResponse.json({
      ok: true,
      updated_at: typeof fallback.data[0]?.updated_at === "string" ? fallback.data[0].updated_at : null,
    })
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return NextResponse.json({
    ok: true,
    updated_at: typeof data[0]?.updated_at === "string" ? data[0].updated_at : null,
  })
}
