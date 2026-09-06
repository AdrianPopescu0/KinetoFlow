export const WEEKDAY_OPTIONS = [
  { id: "lu", short: "L", label: "Luni" },
  { id: "ma", short: "Ma", label: "Marți" },
  { id: "mi", short: "Mi", label: "Miercuri" },
  { id: "jo", short: "J", label: "Joi" },
  { id: "vi", short: "V", label: "Vineri" },
  { id: "sa", short: "S", label: "Sâmbătă" },
  { id: "du", short: "D", label: "Duminică" },
] as const

export type WeekdayId = (typeof WEEKDAY_OPTIONS)[number]["id"]

export const ALL_WEEKDAY_IDS: WeekdayId[] = WEEKDAY_OPTIONS.map((day) => day.id)

export function isWeekdayId(value: string): value is WeekdayId {
  return ALL_WEEKDAY_IDS.includes(value as WeekdayId)
}

export function formatSchedulePrefix(days: WeekdayId[]): string {
  if (days.length === 0) {
    return ""
  }
  if (days.length === ALL_WEEKDAY_IDS.length) {
    return "Program: toată săptămâna"
  }
  const labels = WEEKDAY_OPTIONS.filter((day) => days.includes(day.id)).map((day) => day.label)
  return `Program: ${labels.join(", ")}`
}

export function composeExerciseNotes(description: string, days: WeekdayId[]): string | null {
  const schedule = formatSchedulePrefix(days)
  const body = description.trim()
  if (!schedule && !body) {
    return null
  }
  if (!schedule) {
    return body
  }
  if (!body) {
    return schedule
  }
  return `${schedule}\n${body}`
}

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isDateKey(value: string): boolean {
  if (!DATE_KEY_PATTERN.test(value)) {
    return false
  }
  const parsed = new Date(`${value}T12:00:00Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

export function formatTreatmentInterval(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat("ro-RO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  })
  return `${formatter.format(new Date(`${startDate}T12:00:00Z`))} – ${formatter.format(
    new Date(`${endDate}T12:00:00Z`),
  )}`
}

export function composeIntervalExerciseNotes(
  description: string,
  startDate: string,
  endDate: string,
): string | null {
  const schedule = `Perioadă tratament: ${formatTreatmentInterval(startDate, endDate)}`
  const body = description.trim()
  return body ? `${schedule}\n${body}` : schedule
}

const TREATMENT_INTERVAL_PATTERN =
  /Perioadă tratament:\s*(\d{2})[./](\d{2})[./](\d{4})\s*[–—-]\s*(\d{2})[./](\d{2})[./](\d{4})/i

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

function partsToDateKey(day: string, month: string, year: string): string | null {
  const key = `${year}-${pad2(Number(month))}-${pad2(Number(day))}`
  return isDateKey(key) ? key : null
}

/** Extrage intervalul `YYYY-MM-DD` din notele de tip „Perioadă tratament: …”. */
export function parseTreatmentIntervalFromNotes(
  notes: string | null | undefined,
): { startDate: string; endDate: string } | null {
  if (!notes) {
    return null
  }
  const match = notes.match(TREATMENT_INTERVAL_PATTERN)
  if (!match) {
    return null
  }
  const startDate = partsToDateKey(match[1], match[2], match[3])
  const endDate = partsToDateKey(match[4], match[5], match[6])
  if (!startDate || !endDate) {
    return null
  }
  return startDate <= endDate ? { startDate, endDate } : { startDate: endDate, endDate: startDate }
}

const PROGRAM_LINE_PATTERN = /Program:\s*(.+)/i

const WEEKDAY_FROM_LONG: Record<string, WeekdayId> = {
  sunday: "du",
  monday: "lu",
  tuesday: "ma",
  wednesday: "mi",
  thursday: "jo",
  friday: "vi",
  saturday: "sa",
}

/** Ziua săptămânii pentru o dată `YYYY-MM-DD` (calendar, nu DST). */
export function weekdayIdFromDateKey(dateKey: string): WeekdayId | null {
  if (!isDateKey(dateKey)) {
    return null
  }
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone: "UTC",
  })
    .format(new Date(`${dateKey}T12:00:00Z`))
    .toLowerCase()
  return WEEKDAY_FROM_LONG[weekday] ?? null
}

/**
 * Zilele din prefixul `Program: Luni, Marți` / `Program: toată săptămâna`.
 * Fără prefix → null (nu restricționează).
 */
export function parseScheduledWeekdaysFromNotes(
  notes: string | null | undefined,
): WeekdayId[] | null {
  if (!notes) {
    return null
  }
  const match = notes.match(PROGRAM_LINE_PATTERN)
  if (!match) {
    return null
  }
  const body = match[1].trim().toLocaleLowerCase("ro-RO")
  if (body.startsWith("toată") || body.startsWith("toata")) {
    return [...ALL_WEEKDAY_IDS]
  }
  const found = WEEKDAY_OPTIONS.filter((day) => body.includes(day.label.toLocaleLowerCase("ro-RO")))
  return found.length > 0 ? found.map((day) => day.id) : null
}

/**
 * Exercițiu „activ” în ziua dată:
 * - cu perioadă în notes → ziua e în interval (inclusiv) — ex. 5 zile consecutive
 * - cu `Program: …` → ziua săptămânii e permisă
 * - fără perioadă și fără program → considerat activ (exerciții vechi)
 */
export function isExerciseActiveOnDate(
  notes: string | null | undefined,
  dateKey: string,
): boolean {
  if (!isDateKey(dateKey)) {
    return false
  }
  const interval = parseTreatmentIntervalFromNotes(notes)
  if (interval && (dateKey < interval.startDate || dateKey > interval.endDate)) {
    return false
  }
  const weekdays = parseScheduledWeekdaysFromNotes(notes)
  if (weekdays) {
    const weekday = weekdayIdFromDateKey(dateKey)
    if (!weekday || !weekdays.includes(weekday)) {
      return false
    }
  }
  return true
}
