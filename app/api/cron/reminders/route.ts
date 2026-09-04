import { NextResponse } from "next/server"

import { runCheckinReminders } from "@/lib/reminders/checkin-reminders"
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

  try {
    const supabase = createServiceRoleClient()
    const summary = await runCheckinReminders(supabase, { dryRun })

    return NextResponse.json({
      ok: true,
      dryRun,
      dateKey: summary.dateKey,
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

/** Permite și POST pentru trigger manual / teste. */
export async function POST(request: Request) {
  return handleReminders(request)
}
