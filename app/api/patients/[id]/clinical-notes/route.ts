import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"

import { clinicIdFromUser } from "@/lib/clinics/profile"
import { getOwnPatientRow } from "@/lib/patients/tenant"
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
  try {
    const body = (await request.json()) as { notes?: unknown; clinical_notes?: unknown }
    notes = body.notes ?? body.clinical_notes
  } catch {
    return NextResponse.json({ error: "Payload invalid." }, { status: 400 })
  }

  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Notițele trebuie să fie text." }, { status: 400 })
  }

  const clinicId = clinicIdFromUser(user)
  const owned = await getOwnPatientRow(supabase, user.id, patientId, "id", clinicId)
  if (!owned.data) {
    return NextResponse.json({ error: "Pacientul nu a fost găsit." }, { status: 404 })
  }

  const trimmed = notes.trim().length > 0 ? notes : null
  const { error } = await supabase
    .from("patients")
    .update({ clinical_notes: trimmed })
    .eq("id", patientId)
    .eq("clinic_id", clinicId)

  if (error) {
    const fallback = await supabase
      .from("patients")
      .update({ clinical_notes: trimmed })
      .eq("id", patientId)
      .eq("user_id", user.id)

    if (fallback.error) {
      return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return NextResponse.json({ ok: true })
}
