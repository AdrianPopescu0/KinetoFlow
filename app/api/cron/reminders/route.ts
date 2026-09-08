import { NextResponse } from "next/server"

import { cronErrorMessage, describeCronAuthFailure, isAuthorizedCronRequest } from "@/lib/cron/authorize"
import { configuredNotifyChannels } from "@/lib/patients/notify-patient"
import { runCheckinReminders } from "@/lib/reminders/checkin-reminders"
import {
  CHECKIN_REMINDER_HOUR_BUCHAREST,
  isCheckinReminderWindow,
} from "@/lib/reminders/window"
import { bucharestDateKey, bucharestHour } from "@/lib/time/bucharest"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function failure(error: unknown, status = 500) {
  const message = cronErrorMessage(error)
  console.error("[cron/reminders]", message)
  return NextResponse.json({ ok: false, error: message }, { status })
}

/**
 * Reminder check-in 18:00 Europe/Bucharest.
 * Protejat cu CRON_SECRET — nu e public.
 *
 * cron-job.org (Advanced → Request headers), același secret ca pe Vercel:
 *   Authorization: Bearer ${CRON_SECRET}
 * sau
 *   X-Cron-Secret: ${CRON_SECRET}
 */
async function handleReminders(request: Request) {
  try {
    if (!isAuthorizedCronRequest(request)) {
      const denied = describeCronAuthFailure(request)
      console.warn("[checkin-reminders] Cerere respinsă.", {
        reason: denied.reason,
        hasCronSecret: Boolean(process.env.CRON_SECRET?.trim()),
        hasAuthorization: Boolean(request.headers.get("authorization")),
        hasCronSecretHeader: Boolean(request.headers.get("x-cron-secret") || request.headers.get("x-api-key")),
      })
      return NextResponse.json(
        { ok: false, error: "Neautorizat.", reason: denied.reason, hint: denied.message },
        { status: 401 },
      )
    }

    const url = new URL(request.url)
    const dryRun = url.searchParams.get("dryRun") === "1"
    const force = url.searchParams.get("force") === "1"
    const now = new Date()
    const hour = bucharestHour(now)
    const dateKey = bucharestDateKey(now)
    const inWindow = isCheckinReminderWindow(now)
    const channels = configuredNotifyChannels()

    console.info("[checkin-reminders] Cron /api/cron/reminders apelat.", {
      dateKey,
      bucharestHour: hour,
      reminderHour: CHECKIN_REMINDER_HOUR_BUCHAREST,
      inWindow,
      force,
      dryRun,
      channels,
    })

    if (!force && !inWindow) {
      console.warn("[checkin-reminders] Nu trimit: în afara ferestrei orare.", {
        dateKey,
        bucharestHour: hour,
        reminderHour: CHECKIN_REMINDER_HOUR_BUCHAREST,
        reason: `Ora București e ${hour}:00, reminder-ele pleacă doar la ${CHECKIN_REMINDER_HOUR_BUCHAREST}:00 (sau ?force=1).`,
      })
      return NextResponse.json({
        ok: true,
        skipped: true,
        reason: `În afara ferestrei ${CHECKIN_REMINDER_HOUR_BUCHAREST}:00 Europe/Bucharest.`,
        dateKey,
        bucharestHour: hour,
        reminderHour: CHECKIN_REMINDER_HOUR_BUCHAREST,
        channels,
      })
    }

    const supabase = createServiceRoleClient()
    const summary = await runCheckinReminders(supabase, { dryRun, now })

    return NextResponse.json({
      ok: true,
      dryRun,
      forced: force,
      dateKey: summary.dateKey,
      bucharestHour: hour,
      channels,
      scanned: summary.scanned,
      eligible: summary.eligible,
      sent: summary.sent,
      failed: summary.failed,
      skipped: summary.skipped,
      outcomes: summary.outcomes.map((outcome) => ({
        patientId: outcome.patientId,
        status: outcome.status,
        reason: outcome.reason,
        channel: outcome.channel,
        provider: outcome.provider,
      })),
    })
  } catch (error) {
    return failure(error)
  }
}

/** GET: Vercel Cron și cron-job.org. */
export async function GET(request: Request) {
  try {
    return await handleReminders(request)
  } catch (error) {
    return failure(error)
  }
}

/** POST: trigger manual / cron-job.org. `?force=1` ignoră fereastra 18:00. */
export async function POST(request: Request) {
  try {
    return await handleReminders(request)
  } catch (error) {
    return failure(error)
  }
}
