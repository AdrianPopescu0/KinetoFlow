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

export function loadCompletedExercisesSnapshot(token: string, localDate: string): string {
  const key = exercisesKey(token, localDate)
  if (exerciseCache.has(key)) {
    return exerciseCache.get(key) ?? ""
  }

  if (typeof window === "undefined") {
    exerciseCache.set(key, "")
    return ""
  }

  const fromCheckin = readCheckin(token, localDate)
  if (fromCheckin) {
    const snapshot = fromCheckin.completedExerciseIds.join("|")
    exerciseCache.set(key, snapshot)
    return snapshot
  }

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      exerciseCache.set(key, "")
      return ""
    }
    const parsed: unknown = JSON.parse(raw)
    const snapshot = Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === "string").join("|")
      : ""
    exerciseCache.set(key, snapshot)
    return snapshot
  } catch {
    exerciseCache.set(key, "")
    return ""
  }
}

export function saveCompletedExercises(token: string, localDate: string, ids: string[]): void {
  window.localStorage.setItem(exercisesKey(token, localDate), JSON.stringify(ids))
  emitChange()
}
