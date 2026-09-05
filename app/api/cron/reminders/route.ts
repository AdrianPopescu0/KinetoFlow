import { NextResponse } from "next/server"

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

function authorizeCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) {
    return false
  }
  const header = request.headers.get("authorization")
  if (!header) {
    return false
  }
  const expected = `Bearer ${secret}`
  return header === expected
}

async function handleReminders(request: Request) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 })
  }

  const url = new URL(request.url)
  const dryRun = url.searchParams.get("dryRun") === "1"
  const force = url.searchParams.get("force") === "1"
  const now = new Date()
  const hour = bucharestHour(now)
  const dateKey = bucharestDateKey(now)

  if (!force && !isCheckinReminderWindow(now)) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: `În afara ferestrei ${CHECKIN_REMINDER_HOUR_BUCHAREST}:00 Europe/Bucharest.`,
      dateKey,
      bucharestHour: hour,
      reminderHour: CHECKIN_REMINDER_HOUR_BUCHAREST,
      channels: configuredNotifyChannels(),
    })
  }

  try {
    const supabase = createServiceRoleClient()
    const summary = await runCheckinReminders(supabase, { dryRun, now })

    return NextResponse.json({
      ok: true,
      dryRun,
      forced: force,
      dateKey: summary.dateKey,
      bucharestHour: hour,
      channels: configuredNotifyChannels(),
      scanned: summary.scanned,
      eligible: summary.eligible,
      sent: summary.sent,
      failed: summary.failed,
      skipped: summary.skipped,
      // Detalii utile la debug; pe Vercel logs rămân în response body.
      outcomes: summary.outcomes.map((outcome) => ({
        patientId: outcome.patientId,
        status: outcome.status,
        reason: outcome.reason,
        channel: outcome.channel,
        provider: outcome.provider,
      })),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[cron/reminders]", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

/** Vercel Cron apelează GET. */
export async function GET(request: Request) {
  return handleReminders(request)
}

/** Permite și POST pentru trigger manual / teste (`?force=1` ignoră fereastra 18:30). */
export async function POST(request: Request) {
  return handleReminders(request)
}
