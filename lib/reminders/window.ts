import { bucharestHour } from "@/lib/time/bucharest"

/** Ora locală România la care se trimit reminder-ele de check-in. */
export const CHECKIN_REMINDER_HOUR_BUCHAREST = 18

/**
 * Vercel Cron e doar UTC, deci job-ul e programat la 15:00 și 16:00 UTC
 * (18:00 EEST / 18:00 EET). Trimitem doar când ceasul din București e 18.
 */
export function isCheckinReminderWindow(now: Date = new Date()): boolean {
  return bucharestHour(now) === CHECKIN_REMINDER_HOUR_BUCHAREST
}
