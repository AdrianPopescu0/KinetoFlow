/** Plafon 24h — o ședință de recuperare nu e măsurată peste o zi calendaristică. */
export const MAX_EXERCISE_DURATION_SECONDS = 86_400

export function parseIsoInstant(value: string | null | undefined): Date | null {
  if (!value || typeof value !== "string") {
    return null
  }
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function earliestInstant(...values: Array<string | Date | null | undefined>): Date | null {
  let earliest: Date | null = null
  for (const value of values) {
    const date = value instanceof Date ? value : parseIsoInstant(value)
    if (!date) {
      continue
    }
    if (!earliest || date.getTime() < earliest.getTime()) {
      earliest = date
    }
  }
  return earliest
}

/** Secunde între start (primul exercițiu) și final (trimiterea check-in-ului). */
export function computeExerciseDurationSeconds(
  startedAt: Date | string | null | undefined,
  endedAt: Date | string = new Date(),
): number | null {
  const start = startedAt instanceof Date ? startedAt : parseIsoInstant(startedAt)
  const end = endedAt instanceof Date ? endedAt : parseIsoInstant(endedAt)
  if (!start || !end) {
    return null
  }
  const seconds = Math.round((end.getTime() - start.getTime()) / 1000)
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null
  }
  return Math.min(MAX_EXERCISE_DURATION_SECONDS, seconds)
}

export function formatExerciseDuration(seconds: number | null | undefined): string {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) {
    return "—"
  }
  const totalMinutes = Math.round(seconds / 60)
  if (totalMinutes < 1) {
    return seconds === 0 ? "0 min" : "< 1 min"
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours === 0) {
    return `${minutes} min`
  }
  if (minutes === 0) {
    return `${hours} h`
  }
  return `${hours} h ${minutes} min`
}
