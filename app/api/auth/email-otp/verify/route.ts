import { NextResponse } from "next/server"

import { consumeAuthEmailOtp } from "@/lib/auth/email-otp-issue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Verifică OTP-ul de 6 cifre din email.
 * Body: { email: string, code: string }
 */
export async function POST(request: Request) {
  let body: { email?: unknown; code?: unknown; token?: unknown }
  try {
    body = (await request.json()) as { email?: unknown; code?: unknown; token?: unknown }
  } catch {
    return NextResponse.json({ ok: false, error: "Payload invalid." }, { status: 400 })
  }

  const result = await consumeAuthEmailOtp({
    email: typeof body.email === "string" ? body.email : "",
    code: typeof body.code === "string" ? body.code : "",
    linkToken: typeof body.token === "string" ? body.token : "",
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 })
  }

  return NextResponse.json({ ok: true, email: result.email })
}
