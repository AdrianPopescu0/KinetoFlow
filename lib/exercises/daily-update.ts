import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import {
  isExerciseActiveOnDate,
  parseTreatmentIntervalFromNotes,
} from "@/lib/exercises/schedule"
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
  startingToday: number
  endingToday: number
  staleCompletionsRemoved: number
}

function isMissingTable(error: { code?: string; message?: string } | null): boolean {
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

function isMissingColumn(error: { code?: string; message?: string } | null, column: string): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    (message.includes(column.toLowerCase()) &&
      (message.includes("could not find") || message.includes("schema cache") || message.includes("does not exist")))
  )
}

async function removeStaleCompletions(
  supabase: SupabaseClient,
  dateKey: string,
  inactiveIds: string[],
): Promise<number> {
  if (inactiveIds.length === 0) {
    return 0
  }

  for (const column of ["completed_on", "local_date"] as const) {
    const { data: removed, error } = await supabase
      .from("exercise_completions")
      .delete()
      .eq(column, dateKey)
      .in("exercise_id", inactiveIds)
      .select("id")

    if (!error) {
      return removed?.length ?? 0
    }
    if (isMissingTable(error) || isMissingColumn(error, column)) {
      continue
    }
    throw new Error(`Nu am putut curăța finalizările inactive: ${error.message}`)
  }

  return 0
}

/**
 * Pregătește programul zilei curente (Europe/Bucharest).
 *
 * Exercițiile rămân pe pacient cu intervalul din `notes`
 * (`Perioadă tratament: DD.MM.YYYY – DD.MM.YYYY`). La miezul nopții
 * „ziua nouă” e noul `dateKey`: portalul arată doar exercițiile active azi,
 * iar marcajele de finalizare sunt pe dată, deci încep goale.
 *
 * Job-ul recalculează setul activ, numără schemele care încep/se termină azi
 * și șterge finalizările greșit legate de exerciții inactive.
 */
export async function runDailyExerciseUpdate(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<DailyExerciseUpdateSummary> {
  const dateKey = bucharestDateKey(now)
  const { data, error } = await supabase.from("exercises").select("id, patient_id, notes")

  if (error) {
    throw new Error(`Nu am putut citi exercițiile: ${error.message}`)
  }

  const exercises = (data ?? []) as ExerciseRow[]
  const active: ExerciseRow[] = []
  const inactiveIds: string[] = []
  let startingToday = 0
  let endingToday = 0

  for (const exercise of exercises) {
    if (isExerciseActiveOnDate(exercise.notes, dateKey)) {
      active.push(exercise)
      const interval = parseTreatmentIntervalFromNotes(exercise.notes)
      if (interval?.startDate === dateKey) {
        startingToday += 1
      }
      if (interval?.endDate === dateKey) {
        endingToday += 1
      }
    } else {
      inactiveIds.push(exercise.id)
    }
  }

  const staleCompletionsRemoved = await removeStaleCompletions(supabase, dateKey, inactiveIds)

  return {
    dateKey,
    scanned: exercises.length,
    active: active.length,
    inactive: inactiveIds.length,
    affectedPatients: new Set(active.map((exercise) => exercise.patient_id)).size,
    startingToday,
    endingToday,
    staleCompletionsRemoved,
  }
}
