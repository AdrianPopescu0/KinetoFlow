import type { DailyCheckin } from "@/lib/patients/types"

const listeners = new Set<() => void>()
const checkinCache = new Map<string, DailyCheckin | null>()
const exerciseCache = new Map<string, string>()

function storageKey(token: string, localDate: string): string {
  return `kinetoflow:checkin:${token}:${localDate}`
}

function exercisesKey(token: string, localDate: string): string {
  return `kinetoflow:exercises:${token}:${localDate}`
}

function emitChange() {
  checkinCache.clear()
  exerciseCache.clear()
  listeners.forEach((listener) => listener())
}

export function subscribePatientStorage(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

function isDailyCheckin(value: unknown): value is DailyCheckin {
  if (!value || typeof value !== "object") {
    return false
  }

  const record = value as Record<string, unknown>
  return (
    typeof record.submittedAt === "string" &&
    typeof record.localDate === "string" &&
    typeof record.pain === "number" &&
    typeof record.sleep === "string" &&
    typeof record.notes === "string" &&
    Array.isArray(record.completedExerciseIds)
  )
}

function readCheckin(token: string, localDate: string): DailyCheckin | null {
  const key = storageKey(token, localDate)
  if (checkinCache.has(key)) {
    return checkinCache.get(key) ?? null
  }

  if (typeof window === "undefined") {
    checkinCache.set(key, null)
    return null
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      checkinCache.set(key, null)
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    const value = isDailyCheckin(parsed) ? parsed : null
    checkinCache.set(key, value)
    return value
  } catch {
    checkinCache.set(key, null)
    return null
  }
}

function readExercisesRaw(token: string, localDate: string): string[] | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const raw = window.localStorage.getItem(exercisesKey(token, localDate))
    if (!raw) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    return parsed.filter((id): id is string => typeof id === "string")
  } catch {
    return null
  }
}

export function loadTodaysCheckin(token: string, localDate: string): DailyCheckin | null {
  return readCheckin(token, localDate)
}

export function saveTodaysCheckin(token: string, checkin: DailyCheckin): void {
  window.localStorage.setItem(storageKey(token, checkin.localDate), JSON.stringify(checkin))
  window.localStorage.setItem(
    exercisesKey(token, checkin.localDate),
    JSON.stringify(checkin.completedExerciseIds),
  )
  emitChange()
}

/**
 * Snapshot exerciții efectuate azi.
 * Cheia dedicată `exercises` are prioritate — altfel un check-in vechi din localStorage
 * anula „Marchează ca Efectuat” imediat după click.
 */
export function loadCompletedExercisesSnapshot(token: string, localDate: string): string {
  const key = exercisesKey(token, localDate)
  if (exerciseCache.has(key)) {
    return exerciseCache.get(key) ?? ""
  }

  if (typeof window === "undefined") {
    exerciseCache.set(key, "")
    return ""
  }

  const fromExercises = readExercisesRaw(token, localDate)
  if (fromExercises) {
    const snapshot = fromExercises.join("|")
    exerciseCache.set(key, snapshot)
    return snapshot
  }

  const fromCheckin = readCheckin(token, localDate)
  if (fromCheckin) {
    const snapshot = fromCheckin.completedExerciseIds.join("|")
    exerciseCache.set(key, snapshot)
    return snapshot
  }

  exerciseCache.set(key, "")
  return ""
}

export function saveCompletedExercises(token: string, localDate: string, ids: string[]): void {
  window.localStorage.setItem(exercisesKey(token, localDate), JSON.stringify(ids))

  // Păstrează check-in-ul local aliniat, fără să blocheze toggle-ul.
  const existing = readCheckin(token, localDate)
  if (existing) {
    window.localStorage.setItem(
      storageKey(token, localDate),
      JSON.stringify({ ...existing, completedExerciseIds: ids }),
    )
  }

  emitChange()
}
