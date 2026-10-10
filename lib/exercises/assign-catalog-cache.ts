"use client"

import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { loadCustomExercises } from "@/lib/exercises/extras"
import { mergeLibraryCatalog } from "@/lib/exercises/merge-catalog"
import type { LibraryExercise } from "@/lib/exercises/types"
import type { TrainingProtocol } from "@/lib/protocols/types"

let catalogCache: LibraryExercise[] | null = null
let protocolsCache: TrainingProtocol[] | null = null

function withLocalExtras(catalog: LibraryExercise[]): LibraryExercise[] {
  return mergeLibraryCatalog(catalog, [...loadCustomExercises(), ...LIBRARY_EXERCISES])
}

/** Seed din datele serverului (dashboard layout) — fără rețea. */
export function seedAssignCatalogCache(catalog: LibraryExercise[]): void {
  catalogCache = catalog
}

export function seedAssignProtocolsCache(protocols: TrainingProtocol[]): void {
  protocolsCache = protocols.filter((item) => item.exercises.length > 0)
}

export function getAssignCatalogSync(): LibraryExercise[] {
  if (catalogCache) {
    return withLocalExtras(catalogCache)
  }
  return withLocalExtras([])
}

export function getAssignProtocolsSync(): TrainingProtocol[] {
  return protocolsCache ?? []
}

export function upsertAssignCatalogExercise(exercise: LibraryExercise): void {
  const current = catalogCache ?? []
  catalogCache = [exercise, ...current.filter((item) => item.id !== exercise.id)]
}

export function invalidateAssignCatalogCache(): void {
  catalogCache = null
}

export function invalidateAssignProtocolsCache(): void {
  protocolsCache = null
}
