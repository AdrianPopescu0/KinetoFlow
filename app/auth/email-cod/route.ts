import { NextResponse } from "next/server"

import { EMAIL_OTP_TTL_MS, signVerifiedEmailCookie } from "@/lib/auth/email-otp"
import { consumeAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token") ?? ""
  const result = await consumeAuthEmailOtp({ linkToken: token })
  const redirectTo = new URL("/login", url.origin)

  if (!result.ok) {
    redirectTo.searchParams.set("reason", "otp_invalid")
    return NextResponse.redirect(redirectTo)
  }

  redirectTo.searchParams.set("reason", "otp_ok")
  const response = NextResponse.redirect(redirectTo)
  response.cookies.set(VERIFIED_OTP_COOKIE, signVerifiedEmailCookie(result.email, Date.now() + EMAIL_OTP_TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(EMAIL_OTP_TTL_MS / 1000),
  })
  return response
}
