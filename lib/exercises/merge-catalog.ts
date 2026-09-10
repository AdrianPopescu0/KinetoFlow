import type { LibraryExercise } from "@/lib/exercises/types"

export const HIDDEN_LIBRARY_IDS_KEY = "kf_hidden_library_ids"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPersistedLibraryId(id: string): boolean {
  return UUID_PATTERN.test(id.trim())
}

export function parseHiddenLibraryIds(raw: string | null | undefined): string[] {
  if (!raw) {
    return []
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return [...new Set(parsed.filter((value): value is string => typeof value === "string" && value.length > 0))]
  } catch {
    return []
  }
}

export function serializeHiddenLibraryIds(ids: Iterable<string>): string {
  return JSON.stringify([...new Set(ids)])
}

export function mergeLibraryCatalog(
  stored: LibraryExercise[],
  seeded: LibraryExercise[],
  hiddenIds: Iterable<string> = [],
): LibraryExercise[] {
  const hidden = hiddenIds instanceof Set ? hiddenIds : new Set(hiddenIds)
  const storedIds = new Set(stored.map((item) => item.id))
  return [
    ...stored.filter((item) => !hidden.has(item.id)),
    ...seeded.filter((item) => !storedIds.has(item.id) && !hidden.has(item.id)),
  ]
}
