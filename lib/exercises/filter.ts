import { REGIONS } from "@/lib/exercises/taxonomy"
import type { AnatomicalRegion, LibraryExercise, LibraryFilters } from "@/lib/exercises/types"

export const EMPTY_FILTERS: LibraryFilters = {
  query: "",
  region: "all",
  subcategory: "all",
  difficulty: "all",
  equipment: "all",
  position: "all",
}

function matchesQuery(exercise: LibraryExercise, query: string): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return true
  }
  return `${exercise.title} ${exercise.description}`.toLowerCase().includes(needle)
}

export function filterLibrary(exercises: LibraryExercise[], filters: LibraryFilters): LibraryExercise[] {
  return exercises.filter((exercise) => {
    if (!matchesQuery(exercise, filters.query)) {
      return false
    }
    if (filters.region !== "all" && exercise.region !== filters.region) {
      return false
    }
    if (filters.subcategory !== "all" && exercise.subcategory !== filters.subcategory) {
      return false
    }
    if (filters.difficulty !== "all" && exercise.difficulty !== filters.difficulty) {
      return false
    }
    if (filters.equipment !== "all" && exercise.equipment !== filters.equipment) {
      return false
    }
    if (filters.position !== "all" && exercise.position !== filters.position) {
      return false
    }
    return true
  })
}

export function regionCounts(
  exercises: LibraryExercise[],
  filters: Omit<LibraryFilters, "region" | "subcategory">,
): Record<AnatomicalRegion | "all", number> {
  const withoutRegion: LibraryFilters = {
    ...EMPTY_FILTERS,
    query: filters.query,
    difficulty: filters.difficulty,
    equipment: filters.equipment,
    position: filters.position,
    region: "all",
    subcategory: "all",
  }
  const matched = filterLibrary(exercises, withoutRegion)
  const counts = {
    all: matched.length,
    ...Object.fromEntries(REGIONS.map((region) => [region.id, 0])),
  } as Record<AnatomicalRegion | "all", number>

  for (const exercise of matched) {
    counts[exercise.region] += 1
  }
  return counts
}

export function subcategoriesForRegion(region: AnatomicalRegion | "all") {
  if (region === "all") {
    return []
  }
  return REGIONS.find((item) => item.id === region)?.subcategories ?? []
}
