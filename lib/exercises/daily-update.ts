import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isExerciseActiveOnDate } from "@/lib/exercises/schedule"
import { bucharestDateKey } from "@/lib/time/bucharest"

type ExerciseRow = {
  id: string
  patient_id: string
  notes: string | null
}

export type DailyExerciseUpdateSummary = {
  dateKey: string
  scanned: number
  active: number
  inactive: number
  affectedPatients: number
  staleCompletionsRemoved: number
}

/**
 * Recalculează programul activ al zilei și elimină marcajele de finalizare
 * pentru exercițiile care nu sunt active în ziua respectivă.
 *
 * Exercițiile nu sunt șterse/modificate: istoricul prescrierii rămâne intact,
 * iar portalul filtrează aceleași intervale la fiecare încărcare.
 */
export async function runDailyExerciseUpdate(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<DailyExerciseUpdateSummary> {
  const dateKey = bucharestDateKey(now)
  const { data, error } = await supabase
    .from("exercises")
    .select("id, patient_id, notes")

  if (error) {
    throw new Error(`Nu am putut citi exercițiile: ${error.message}`)
  }

  const exercises = (data ?? []) as ExerciseRow[]
  const active = exercises.filter((exercise) =>
    isExerciseActiveOnDate(exercise.notes, dateKey),
  )
  const inactiveIds = exercises
    .filter((exercise) => !isExerciseActiveOnDate(exercise.notes, dateKey))
    .map((exercise) => exercise.id)

  let staleCompletionsRemoved = 0
  if (inactiveIds.length > 0) {
    const { data: removed, error: cleanupError } = await supabase
      .from("exercise_completions")
      .delete()
      .eq("completed_on", dateKey)
      .in("exercise_id", inactiveIds)
      .select("id")

    // Tabela este introdusă de migrarea 016; nu blocăm actualizarea dacă lipsește.
    if (
      cleanupError &&
      cleanupError.code !== "PGRST205" &&
      cleanupError.code !== "42P01"
    ) {
      throw new Error(
        `Nu am putut curăța finalizările inactive: ${cleanupError.message}`,
      )
    }
    staleCompletionsRemoved = removed?.length ?? 0
  }

  return {
    dateKey,
    scanned: exercises.length,
    active: active.length,
    inactive: inactiveIds.length,
    affectedPatients: new Set(active.map((exercise) => exercise.patient_id)).size,
    staleCompletionsRemoved,
  }
}
