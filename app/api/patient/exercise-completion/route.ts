import { NextResponse } from "next/server"

import {
  listCompletedExerciseIdsForDay,
  setExerciseCompletion,
} from "@/lib/patients/exercise-completions"
import { isDateKey } from "@/lib/exercises/schedule"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

type Body = {
  token?: unknown
  exerciseId?: unknown
  completed?: unknown
  localDate?: unknown
}

/**
 * Portal pacient (fără Auth): marchează / anulează un exercițiu pentru ziua curentă.
 * Auth = token UUID al pacientului (același din /patient/[token]).
 */
export async function POST(request: Request) {
  let body: Body
  try {
    body = (await request.json()) as Body
  } catch {
    return NextResponse.json({ error: "Payload invalid.", completedIds: [] }, { status: 400 })
  }

  const token = typeof body.token === "string" ? body.token.trim() : ""
  const exerciseId = typeof body.exerciseId === "string" ? body.exerciseId.trim() : ""
  const localDate = typeof body.localDate === "string" ? body.localDate.trim() : ""
  const completed = Boolean(body.completed)

  if (!isUuid(token) || !isUuid(exerciseId) || !isDateKey(localDate)) {
    return NextResponse.json(
      { error: "Cerere invalidă (token, exercițiu sau dată).", completedIds: [] },
      { status: 400 },
    )
  }

  try {
    const admin = createServiceRoleClient()
    const { data: patient, error: patientError } = await admin
      .from("patients")
      .select("id")
      .eq("token", token)
      .maybeSingle()

    if (patientError || !patient?.id) {
      return NextResponse.json(
        { error: "Programul pacientului nu a fost găsit.", completedIds: [] },
        { status: 404 },
      )
    }

    const result = await setExerciseCompletion({
      supabase: admin,
      patientId: patient.id,
      exerciseId,
      completed,
      completedOn: localDate,
    })

    const completedIds = await listCompletedExerciseIdsForDay(admin, patient.id, localDate)

    if (result.error) {
      console.error("[exercise-completion]", result.error, {
        patientId: patient.id,
        exerciseId,
        localDate,
        completed,
      })
      return NextResponse.json({ error: result.error, completedIds }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      patientId: patient.id,
      exerciseId,
      completed,
      localDate,
      completedIds,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[exercise-completion]", message)
    return NextResponse.json({ error: message, completedIds: [] }, { status: 500 })
  }
}
