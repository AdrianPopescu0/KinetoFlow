"use server"

import {
  listCompletedExerciseIdsForDay,
  setExerciseCompletion,
} from "@/lib/patients/exercise-completions"
import { isDateKey } from "@/lib/exercises/schedule"
import { createServiceRoleClient } from "@/utils/supabase/admin"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export async function togglePatientExerciseCompletion(input: {
  token: string
  exerciseId: string
  completed: boolean
  localDate: string
}): Promise<{ error: string | null; completedIds: string[] }> {
  const token = input.token?.trim() ?? ""
  const exerciseId = input.exerciseId?.trim() ?? ""
  const localDate = input.localDate?.trim() ?? ""

  if (!isUuid(token) || !isUuid(exerciseId) || !isDateKey(localDate)) {
    return { error: "Cerere invalidă.", completedIds: [] }
  }

  try {
    const admin = createServiceRoleClient()
    const { data: patient, error: patientError } = await admin
      .from("patients")
      .select("id")
      .eq("token", token)
      .maybeSingle()

    if (patientError || !patient?.id) {
      return { error: "Programul pacientului nu a fost găsit.", completedIds: [] }
    }

    const result = await setExerciseCompletion({
      supabase: admin,
      patientId: patient.id,
      exerciseId,
      completed: Boolean(input.completed),
      completedOn: localDate,
    })

    const completedIds = await listCompletedExerciseIdsForDay(admin, patient.id, localDate)

    if (result.error) {
      return { error: result.error, completedIds }
    }

    return { error: null, completedIds }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    return { error: message, completedIds: [] }
  }
}
