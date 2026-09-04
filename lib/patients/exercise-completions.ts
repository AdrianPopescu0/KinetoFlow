import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isDateKey } from "@/lib/exercises/schedule"
import { bucharestDateKey } from "@/lib/time/bucharest"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function isMissingCompletionsTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (message.includes("exercise_completions") && message.includes("could not find the table"))
  )
}

export async function listCompletedExerciseIdsForDay(
  supabase: SupabaseClient,
  patientId: string,
  completedOn = bucharestDateKey(),
): Promise<string[]> {
  if (!isUuid(patientId) || !isDateKey(completedOn)) {
    return []
  }

  const { data, error } = await supabase
    .from("exercise_completions")
    .select("exercise_id")
    .eq("patient_id", patientId)
    .eq("completed_on", completedOn)

  if (error) {
    if (isMissingCompletionsTable(error)) {
      return []
    }
    console.error("[exercise_completions] list", error.message)
    return []
  }

  return (data ?? [])
    .map((row) => (typeof row.exercise_id === "string" ? row.exercise_id : null))
    .filter((id): id is string => Boolean(id))
}

export async function setExerciseCompletion(input: {
  supabase: SupabaseClient
  patientId: string
  exerciseId: string
  completed: boolean
  completedOn: string
}): Promise<{ error: string | null }> {
  const { supabase, patientId, exerciseId, completed, completedOn } = input

  if (!isUuid(patientId) || !isUuid(exerciseId) || !isDateKey(completedOn)) {
    return { error: "Date invalide." }
  }

  const { data: owned, error: ownedError } = await supabase
    .from("exercises")
    .select("id")
    .eq("id", exerciseId)
    .eq("patient_id", patientId)
    .maybeSingle()

  if (ownedError || !owned) {
    return { error: "Exercițiul nu aparține acestui pacient." }
  }

  if (completed) {
    const { error } = await supabase.from("exercise_completions").upsert(
      {
        patient_id: patientId,
        exercise_id: exerciseId,
        completed_on: completedOn,
      },
      { onConflict: "patient_id,exercise_id,completed_on", ignoreDuplicates: true },
    )

    if (error) {
      if (isMissingCompletionsTable(error)) {
        return {
          error:
            "Lipsește tabela exercise_completions. Rulează supabase/migrations/016_exercise_completions.sql.",
        }
      }
      return { error: "Nu am putut salva finalizarea. Încearcă din nou." }
    }

    return { error: null }
  }

  const { error } = await supabase
    .from("exercise_completions")
    .delete()
    .eq("patient_id", patientId)
    .eq("exercise_id", exerciseId)
    .eq("completed_on", completedOn)

  if (error) {
    if (isMissingCompletionsTable(error)) {
      return {
        error:
          "Lipsește tabela exercise_completions. Rulează supabase/migrations/016_exercise_completions.sql.",
      }
    }
    return { error: "Nu am putut anula finalizarea. Încearcă din nou." }
  }

  return { error: null }
}

export async function syncExerciseCompletionsForDay(input: {
  supabase: SupabaseClient
  patientId: string
  exerciseIds: string[]
  completedOn: string
}): Promise<void> {
  const { supabase, patientId, exerciseIds, completedOn } = input
  const unique = Array.from(new Set(exerciseIds.filter(isUuid)))
  if (!isUuid(patientId) || !isDateKey(completedOn) || unique.length === 0) {
    return
  }

  const { data: owned } = await supabase
    .from("exercises")
    .select("id")
    .eq("patient_id", patientId)
    .in("id", unique)

  const ownedIds = new Set((owned ?? []).map((row) => row.id as string))
  const rows = unique
    .filter((id) => ownedIds.has(id))
    .map((exerciseId) => ({
      patient_id: patientId,
      exercise_id: exerciseId,
      completed_on: completedOn,
    }))

  if (rows.length === 0) {
    return
  }

  await supabase
    .from("exercise_completions")
    .upsert(rows, { onConflict: "patient_id,exercise_id,completed_on", ignoreDuplicates: true })
}
