import { bucharestHour } from "@/lib/time/bucharest"

/** Reminder check-in: 18:00 Europe/Bucharest. */
export const CHECKIN_REMINDER_HOUR_BUCHAREST = 18

/**
 * Rollover de program: 00:00 România.
 * Un singur cron Hobby la 22:00 UTC = 00:00 EET (iarnă) sau 01:00 EEST (vară).
 * În ambele cazuri `bucharestDateKey` e deja ziua nouă.
 */
export function isMidnightProgramWindow(now: Date = new Date()): boolean {
  const hour = bucharestHour(now)
  return hour === 0 || hour === 1
}

export function isCheckinReminderWindow(now: Date = new Date()): boolean {
  return bucharestHour(now) === CHECKIN_REMINDER_HOUR_BUCHAREST
}
