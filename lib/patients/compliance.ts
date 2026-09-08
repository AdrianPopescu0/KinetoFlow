import { addBucharestCalendarDays, bucharestDateKey } from "../time/bucharest.ts"

export const REAL_FREQUENCY_WINDOW_DAYS = 7

export function formatRealFrequency(activeDays: number, windowDays = REAL_FREQUENCY_WINDOW_DAYS): string {
  const active = Number.isFinite(activeDays) ? Math.max(0, Math.round(activeDays)) : 0
  const window = Number.isFinite(windowDays) && windowDays > 0 ? Math.round(windowDays) : REAL_FREQUENCY_WINDOW_DAYS
  return `${Math.min(active, window)}/${window}`
}

/** Zile calendaristice București, inclusiv azi, plafonate la 7, de la crearea fișei. */
export function frequencyWindowDays(createdAt: string | null | undefined, now = new Date()): number {
  const today = bucharestDateKey(now)
  if (!today) {
    return REAL_FREQUENCY_WINDOW_DAYS
  }
  const created = createdAt ? bucharestDateKey(createdAt) : ""
  const windowStart = addBucharestCalendarDays(today, -(REAL_FREQUENCY_WINDOW_DAYS - 1))
  if (!created || created <= windowStart) {
    return REAL_FREQUENCY_WINDOW_DAYS
  }
  if (created > today) {
    return 1
  }
  let days = 1
  let cursor = created
  while (cursor < today && days < REAL_FREQUENCY_WINDOW_DAYS) {
    cursor = addBucharestCalendarDays(cursor, 1)
    days += 1
  }
  return days
}

export function frequencyWindowDateKeys(windowDays: number, now = new Date()): string[] {
  const today = bucharestDateKey(now)
  const count = Math.max(1, Math.min(REAL_FREQUENCY_WINDOW_DAYS, windowDays))
  const start = addBucharestCalendarDays(today, -(count - 1))
  return Array.from({ length: count }, (_, index) => addBucharestCalendarDays(start, index))
}

/**
 * Zile distincte (București) din fereastră în care a existat check-in sau cel puțin un exercițiu efectuat.
 */
export function countActiveFrequencyDays(input: {
  createdAt: string | null | undefined
  checkInAt?: Array<string | null | undefined>
  exerciseCompletedOn?: Array<string | null | undefined>
  now?: Date
}): { activeDays: number; windowDays: number } {
  const now = input.now ?? new Date()
  const windowDays = frequencyWindowDays(input.createdAt, now)
  const windowKeys = new Set(frequencyWindowDateKeys(windowDays, now))
  const active = new Set<string>()

  for (const iso of input.checkInAt ?? []) {
    if (!iso) {
      continue
    }
    const key = bucharestDateKey(iso)
    if (windowKeys.has(key)) {
      active.add(key)
    }
  }

  for (const raw of input.exerciseCompletedOn ?? []) {
    if (typeof raw !== "string" || raw.length < 10) {
      continue
    }
    const key = raw.slice(0, 10)
    if (windowKeys.has(key)) {
      active.add(key)
    }
  }

  return { activeDays: active.size, windowDays }
}

export function clinicAverageFrequency(
  patients: Array<{ activeDaysLast7: number }>,
): { activeDays: number; windowDays: number } {
  if (patients.length === 0) {
    return { activeDays: 0, windowDays: REAL_FREQUENCY_WINDOW_DAYS }
  }
  const total = patients.reduce((sum, patient) => sum + patient.activeDaysLast7, 0)
  return {
    activeDays: Math.round(total / patients.length),
    windowDays: REAL_FREQUENCY_WINDOW_DAYS,
  }
}

/** Sub jumătate din fereastră (ex. 0–3 zile din 7). */
export function isLowRealFrequency(activeDays: number, windowDays: number): boolean {
  if (windowDays <= 0) {
    return true
  }
  return activeDays * 2 < windowDays
}
