import { objectiveBelongsToRegion } from "@/lib/exercises/taxonomy"
import type { AnatomicalRegion, LibraryExercise, TherapeuticObjective } from "@/lib/exercises/types"

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
    return parsed.filter(isLibraryExercise)
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
  const item = value as Partial<LibraryExercise>
  if (typeof item.id !== "string" || typeof item.title !== "string") {
    return false
  }
  if (typeof item.region !== "string" || typeof item.subcategory !== "string") {
    return false
  }
  return objectiveBelongsToRegion(item.region as AnatomicalRegion, item.subcategory as TherapeuticObjective)
}
