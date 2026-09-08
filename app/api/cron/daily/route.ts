import { NextResponse } from "next/server"

import { isAuthorizedCronRequest } from "@/lib/cron/authorize"
import { runResetDailyProgress } from "@/lib/exercises/reset-daily-progress"
import {
  CHECKIN_REMINDER_HOUR_BUCHAREST,
  isCheckinReminderWindow,
  isMidnightProgramWindow,
} from "@/lib/cron/windows"
import { configuredNotifyChannels } from "@/lib/patients/notify-patient"
import { runCheckinReminders } from "@/lib/reminders/checkin-reminders"
import { bucharestDateKey, bucharestHour } from "@/lib/time/bucharest"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type CronTask = "program" | "reminders" | "all"

function parseTask(raw: string | null): CronTask | null {
  if (raw === "program" || raw === "reminders" || raw === "all") {
    return raw
  }
  return null
}

function resolveTasks(task: CronTask | null, force: boolean, now: Date): {
  program: boolean
  reminders: boolean
  skippedReason?: string
} {
  if (task === "all" || (force && !task)) {
    return { program: true, reminders: true }
  }
  if (task === "program") {
    return { program: true, reminders: false }
  }
  if (task === "reminders") {
    return { program: false, reminders: true }
  }
  if (isMidnightProgramWindow(now)) {
    return { program: true, reminders: false }
  }
  if (isCheckinReminderWindow(now)) {
    return { program: false, reminders: true }
  }
  return {
    program: false,
    reminders: false,
    skippedReason:
      "În afara ferestrelor 00:00 (program) și 18:00 (reminder) Europe/Bucharest. Folosește ?force=1 sau ?task=program.",
  }
}

async function handleDailyCron(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 })
  }

  const url = new URL(request.url)
  const force = url.searchParams.get("force") === "1"
  const dryRun = url.searchParams.get("dryRun") === "1"
  const task = parseTask(url.searchParams.get("task"))
  const now = new Date()
  const planned = resolveTasks(task, force, now)
  const hour = bucharestHour(now)
  const dateKey = bucharestDateKey(now)

  if (!planned.program && !planned.reminders) {
    console.warn("[checkin-reminders] Cron /api/cron/daily: în afara ferestrei orare.", {
      dateKey,
      bucharestHour: hour,
      force,
      task,
      reason: planned.skippedReason,
    })
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: planned.skippedReason,
      dateKey,
      bucharestHour: hour,
    })
  }

  console.info("[checkin-reminders] Cron /api/cron/daily pornește task-urile.", {
    dateKey,
    bucharestHour: hour,
    force,
    dryRun,
    task,
    ran: { program: planned.program, reminders: planned.reminders },
    channels: configuredNotifyChannels(),
  })

  try {
    const supabase = createServiceRoleClient()
    const program = planned.program ? await runResetDailyProgress(supabase, now) : null
    const reminders = planned.reminders
      ? await runCheckinReminders(supabase, { dryRun, now })
      : null

    return NextResponse.json({
      ok: true,
      forced: force,
      dryRun,
      dateKey,
      bucharestHour: hour,
      ran: {
        program: planned.program,
        reminders: planned.reminders,
      },
      program,
      reminders: reminders
        ? {
            scanned: reminders.scanned,
            eligible: reminders.eligible,
            sent: reminders.sent,
            failed: reminders.failed,
            skipped: reminders.skipped,
            channels: configuredNotifyChannels(),
            reminderHour: CHECKIN_REMINDER_HOUR_BUCHAREST,
            outcomes: reminders.outcomes.map((outcome) => ({
              patientId: outcome.patientId,
              status: outcome.status,
              reason: outcome.reason,
              channel: outcome.channel,
              provider: outcome.provider,
            })),
          }
        : null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[cron/daily]", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

/** Vercel Cron (Hobby: o dată pe zi, 22:00 UTC ≈ 00:00 România). */
export async function GET(request: Request) {
  return handleDailyCron(request)
}

export async function POST(request: Request) {
  return handleDailyCron(request)
}
