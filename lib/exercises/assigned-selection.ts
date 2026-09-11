import { parseTreatmentIntervalFromNotes } from "./schedule.ts"
import type { LibraryExercise } from "./types.ts"

export type AssignedProgramExercise = {
  title: string
  video_url?: string | null
  sets?: number | null
  reps?: number | null
  notes?: string | null
}

export type ExerciseDose = {
  sets: number
  reps: number
}

export type TreatmentInterval = {
  startDate: string
  endDate: string
}

export function normalizeExerciseTitle(title: string): string {
  return title.trim().toLocaleLowerCase("ro-RO")
}

function normalizeVideoUrl(url: string | null | undefined): string {
  return (url ?? "").trim().toLowerCase()
}

function positiveInt(value: number | null | undefined, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 ? Math.min(99, Math.trunc(value)) : fallback
}

export function assignedExerciseMatchesInterval(
  notes: string | null | undefined,
  interval: TreatmentInterval,
): boolean {
  const parsed = parseTreatmentIntervalFromNotes(notes)
  return Boolean(parsed && parsed.startDate === interval.startDate && parsed.endDate === interval.endDate)
}

export function preferredTreatmentInterval(
  assigned: AssignedProgramExercise[],
  fallback: TreatmentInterval,
  today: string,
): TreatmentInterval {
  const intervals = assigned
    .map((exercise) => parseTreatmentIntervalFromNotes(exercise.notes))
    .filter((interval): interval is TreatmentInterval => interval !== null)

  if (intervals.length === 0) {
    return fallback
  }

  const coveringToday = intervals.filter(
    (interval) => interval.startDate <= today && today <= interval.endDate,
  )
  const pool = coveringToday.length > 0 ? coveringToday : intervals
  return [...pool].sort(
    (left, right) => right.endDate.localeCompare(left.endDate) || right.startDate.localeCompare(left.startDate),
  )[0]!
}

function findLibraryMatch(
  catalog: LibraryExercise[],
  assigned: AssignedProgramExercise,
  usedIds: Set<string>,
): LibraryExercise | null {
  const title = normalizeExerciseTitle(assigned.title)
  if (!title) {
    return null
  }
  const video = normalizeVideoUrl(assigned.video_url)
  const candidates = catalog.filter(
    (exercise) => !usedIds.has(exercise.id) && normalizeExerciseTitle(exercise.title) === title,
  )
  if (candidates.length === 0) {
    return null
  }
  if (video) {
    const byVideo = candidates.find((exercise) => normalizeVideoUrl(exercise.videoUrl) === video)
    if (byVideo) {
      return byVideo
    }
  }
  return candidates[0] ?? null
}

/** Checkbox-uri și doze pentru exercițiile deja alocate pe intervalul ales. */
export function librarySelectionForAssignedInterval(
  catalog: LibraryExercise[],
  assigned: AssignedProgramExercise[],
  interval: TreatmentInterval,
): { selectedIds: string[]; doses: Record<string, ExerciseDose> } {
  const selectedIds: string[] = []
  const doses: Record<string, ExerciseDose> = {}
  const usedIds = new Set<string>()

  for (const row of assigned) {
    if (!assignedExerciseMatchesInterval(row.notes, interval)) {
      continue
    }
    const match = findLibraryMatch(catalog, row, usedIds)
    if (!match) {
      continue
    }
    usedIds.add(match.id)
    selectedIds.push(match.id)
    doses[match.id] = {
      sets: positiveInt(row.sets, match.sets),
      reps: positiveInt(row.reps, match.reps),
    }
  }

  return { selectedIds, doses }
}
