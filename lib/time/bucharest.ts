export const BUCHAREST_TIME_ZONE = "Europe/Bucharest"

type TzWallClock = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function asDate(input: Date | string): Date {
  return typeof input === "string" ? new Date(input) : input
}

function wallClockInTimeZone(date: Date, timeZone: string): TzWallClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)

  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0"

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
  }
}

function pad2(value: number): string {
  return String(value).padStart(2, "0")
}

/** Calendar date `YYYY-MM-DD` in Europe/Bucharest. */
export function bucharestDateKey(input: Date | string = new Date()): string {
  const date = asDate(input)
  if (Number.isNaN(date.getTime())) {
    return ""
  }
  const wall = wallClockInTimeZone(date, BUCHAREST_TIME_ZONE)
  return `${wall.year}-${pad2(wall.month)}-${pad2(wall.day)}`
}

export function isBucharestToday(input: Date | string, now = new Date()): boolean {
  const key = bucharestDateKey(input)
  return key.length > 0 && key === bucharestDateKey(now)
}

function addCalendarDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number)
  const utcNoon = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0))
  return `${utcNoon.getUTCFullYear()}-${pad2(utcNoon.getUTCMonth() + 1)}-${pad2(utcNoon.getUTCDate())}`
}

/**
 * UTC instant for a wall-clock time on a Bucharest calendar date.
 * Uses the real offset that day (EET +02 / EEST +03), not a hardcoded +03:00.
 */
export function bucharestWallTimeToUtc(ymd: string, hour = 0, minute = 0, second = 0, ms = 0): Date {
  const [year, month, day] = ymd.split("-").map(Number)
  const desiredAsUtcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms)
  let instantMs = desiredAsUtcMs

  for (let i = 0; i < 4; i += 1) {
    const wall = wallClockInTimeZone(new Date(instantMs), BUCHAREST_TIME_ZONE)
    const wallAsUtcMs = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second, 0)
    instantMs += desiredAsUtcMs - wallAsUtcMs
  }

  return new Date(instantMs)
}

export function startOfBucharestDay(now = new Date()): Date {
  return bucharestWallTimeToUtc(bucharestDateKey(now), 0, 0, 0, 0)
}

export function startOfNextBucharestDay(now = new Date()): Date {
  return bucharestWallTimeToUtc(addCalendarDays(bucharestDateKey(now), 1), 0, 0, 0, 0)
}

/** Inclusive start of “today” in Bucharest, as UTC ISO — safe for timestamptz filters. */
export function startOfTodayIso(now = new Date()): string {
  return startOfBucharestDay(now).toISOString()
}

export function startOfTomorrowIso(now = new Date()): string {
  return startOfNextBucharestDay(now).toISOString()
}
