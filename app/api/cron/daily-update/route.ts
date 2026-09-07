import { NextResponse } from "next/server"

import { runResetDailyProgress } from "@/lib/exercises/reset-daily-progress"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim()
  return Boolean(secret && request.headers.get("authorization") === `Bearer ${secret}`)
}

async function handleDailyUpdate(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Neautorizat." }, { status: 401 })
  }

  try {
    const summary = await runResetDailyProgress(createServiceRoleClient())
    return NextResponse.json({ ok: true, ...summary })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[cron/daily-update]", message)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

/** Trigger manual / alias. Cron-ul Hobby apelează `/api/cron/daily`. */
export async function GET(request: Request) {
  return handleDailyUpdate(request)
}

export async function POST(request: Request) {
  return handleDailyUpdate(request)
}
