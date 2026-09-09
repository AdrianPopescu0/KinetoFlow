import { NextResponse } from "next/server"

import { issueAuthEmailOtp } from "@/lib/auth/email-otp-issue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Trimite un OTP / link de autentificare pe email (admin sau terapeut).
 * Body: { email: string, purpose?: "login" | "register" }
 */
export async function POST(request: Request) {
  let body: { email?: unknown; purpose?: unknown }
  try {
    body = (await request.json()) as { email?: unknown; purpose?: unknown }
  } catch {
    return NextResponse.json({ ok: false, error: "Payload invalid." }, { status: 400 })
  }

  const result = await issueAuthEmailOtp({
    email: typeof body.email === "string" ? body.email : "",
    purpose: body.purpose,
  })

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: result.status ?? 400 })
  }

  return NextResponse.json({
    ok: true,
    ...(result.devCode ? { devCode: result.devCode } : {}),
  })
}
