import { hydrateLibraryExercise } from "@/lib/exercises/hydrate"
import { parseTagList } from "@/lib/exercises/tags"
import { objectiveBelongsToRegion } from "@/lib/exercises/taxonomy"
import type { AnatomicalRegion, LibraryExercise } from "@/lib/exercises/types"

const STORAGE_KEY = "kinetoflow.exercise-library.extra.v1"

export function loadCustomExercises(): LibraryExercise[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter(isLibraryExercise).map((exercise) => hydrateLibraryExercise(exercise))
  } catch {
    return []
  }
}

export function saveCustomExercises(exercises: LibraryExercise[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(exercises))
}

function isLibraryExercise(value: unknown): value is LibraryExercise {
  if (!value || typeof value !== "object") {
    return false
  }
  const item = value as Partial<LibraryExercise> & {
    region?: unknown
    subcategory?: unknown
    objectives?: unknown
  }
  if (typeof item.id !== "string" || typeof item.title !== "string") {
    return false
  }
  const region = parseTagList(item.regions ?? item.region)[0]
  const objective = parseTagList(item.objectives ?? item.subcategory)[0]
  if (!region || !objective) {
    return false
  }
  return objectiveBelongsToRegion(region as AnatomicalRegion, objective)
}
