import { bucharestHour } from "@/lib/time/bucharest"

/** Ora locală România la care se trimit reminder-ele de check-in. */
export const CHECKIN_REMINDER_HOUR_BUCHAREST = 18

/**
 * Vercel Cron e doar UTC, deci job-ul e programat la 15:30 și 16:30 UTC
 * (18:30 EEST / 18:30 EET). Trimitem doar când ceasul din București e 18.
 */
export function isCheckinReminderWindow(now: Date = new Date()): boolean {
  return bucharestHour(now) === CHECKIN_REMINDER_HOUR_BUCHAREST
}
