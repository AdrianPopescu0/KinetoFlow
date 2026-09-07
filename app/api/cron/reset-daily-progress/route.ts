import { NextResponse } from "next/server"

import {
  isAuthorizedCronRequest,
  isVercelCronInvocation,
  shouldRunDailyProgressReset,
} from "@/lib/cron/authorize"
import { isMidnightProgramWindow } from "@/lib/cron/windows"
import { runResetDailyProgress } from "@/lib/exercises/reset-daily-progress"
import { bucharestDateKey, bucharestHour } from "@/lib/time/bucharest"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function unauthorized() {
  return NextResponse.json({ error: "Neautorizat." }, { status: 401 })
}

async function handleResetDailyProgress(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (!isAuthorizedCronRequest(request, cronSecret)) {
    console.warn("[reset-daily-progress] Cerere respinsă: CRON_SECRET lipsă sau Authorization greșit.", {
      hasCronSecret: Boolean(cronSecret?.trim()),
      hasAuthorization: Boolean(request.headers.get("authorization")),
    })
    return unauthorized()
  }

  const url = new URL(request.url)
  const force = url.searchParams.get("force") === "1"
  const vercelCron = isVercelCronInvocation(request)
  const now = new Date()
  const dateKey = bucharestDateKey(now)
  const hour = bucharestHour(now)

  if (!shouldRunDailyProgressReset({ force, vercelCron, inMidnightWindow: isMidnightProgramWindow(now) })) {
    console.info("[reset-daily-progress] În afara ferestrei 00:00 Europe/Bucharest.", {
      dateKey,
      bucharestHour: hour,
    })
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "În afara ferestrei 00:00 Europe/Bucharest. Folosește ?force=1 pentru rulare manuală.",
      dateKey,
      bucharestHour: hour,
    })
  }

  console.info("[reset-daily-progress] Resetez progresul zilnic al exercițiilor.", {
    dateKey,
    bucharestHour: hour,
    force,
    vercelCron,
  })

  try {
    const summary = await runResetDailyProgress(createServiceRoleClient(), now)
    console.info("[reset-daily-progress] Gata.", summary)
    return NextResponse.json({
      ok: true,
      forced: force,
      vercelCron,
      bucharestHour: hour,
      ...summary,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[reset-daily-progress]", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

/** Vercel Cron Hobby: 22:00 UTC ≈ 00:00 România. Header: Authorization: Bearer ${CRON_SECRET}. */
export async function GET(request: Request) {
  return handleResetDailyProgress(request)
}

export async function POST(request: Request) {
  return handleResetDailyProgress(request)
}
