import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { runDailyExerciseUpdate, type DailyExerciseUpdateSummary } from "@/lib/exercises/daily-update"
import { bucharestDayPair } from "@/lib/time/bucharest"

export type ResetDailyProgressSummary = DailyExerciseUpdateSummary & {
  previousDateKey: string
  completionsYesterday: number
  completionsToday: number
}

function isMissingCompletionsSchema(error: { code?: string; message?: string } | null, column?: string): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  if (error.code === "PGRST205" || error.code === "42P01" || error.code === "PGRST204" || error.code === "42703") {
    return true
  }
  if (message.includes("exercise_completions") && (message.includes("does not exist") || message.includes("schema cache"))) {
    return true
  }
  if (
    column &&
    message.includes(column.toLowerCase()) &&
    (message.includes("could not find") || message.includes("does not exist") || message.includes("schema cache"))
  ) {
    return true
  }
  return false
}

async function countCompletionsForDate(supabase: SupabaseClient, dateKey: string): Promise<number> {
  for (const column of ["completed_on", "local_date"] as const) {
    const { count, error } = await supabase
      .from("exercise_completions")
      .select("id", { count: "exact", head: true })
      .eq(column, dateKey)

    if (!error) {
      return count ?? 0
    }
    if (isMissingCompletionsSchema(error, column)) {
      continue
    }
    throw new Error(`Nu am putut număra finalizările din ${dateKey}: ${error.message}`)
  }
  return 0
}

/**
 * Reset zilnic la ~00:00 Europe/Bucharest.
 *
 * Finalizările sunt pe dată (`completed_on`). Ziua nouă nu moștenește
 * „Efectuat” de ieri; job-ul pregătește setul activ și curăță marcajele
 * legate de exerciții inactive. Istoricul de ieri rămâne pentru compliance.
 */
export async function runResetDailyProgress(
  supabase: SupabaseClient,
  now = new Date(),
): Promise<ResetDailyProgressSummary> {
  const { dateKey, previousDateKey } = bucharestDayPair(now)
  const program = await runDailyExerciseUpdate(supabase, now)
  const [completionsYesterday, completionsToday] = await Promise.all([
    countCompletionsForDate(supabase, previousDateKey),
    countCompletionsForDate(supabase, dateKey),
  ])

  return {
    ...program,
    dateKey,
    previousDateKey,
    completionsYesterday,
    completionsToday,
  }
}
