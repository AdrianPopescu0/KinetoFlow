import { NextResponse } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { SET_PASSWORD_PATH, safeAuthNextPath } from "@/lib/auth/paths"
import { therapistHasClinicProfile } from "@/lib/clinics/profile"
import { createClient } from "@/utils/supabase/server"

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return (
    value === "recovery" ||
    value === "magiclink" ||
    value === "signup" ||
    value === "invite" ||
    value === "email" ||
    value === "email_change"
  )
}

function loginExpiredRedirect(origin: string) {
  return NextResponse.redirect(`${origin}/login?reason=otp_expired`)
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const otpType = searchParams.get("type")
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error")
  const next = safeAuthNextPath(searchParams.get("next")) ?? "/dashboard"

  if (errorCode === "otp_expired" || errorCode === "access_denied") {
    return loginExpiredRedirect(origin)
  }

  const supabase = await createClient()
  let sessionError: string | null = null

  if (tokenHash && isEmailOtpType(otpType)) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    })
    sessionError = error?.message ?? null
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    sessionError = error?.message ?? null
  } else {
    return NextResponse.redirect(`${origin}/login`)
  }

  if (sessionError) {
    const expired =
      sessionError.toLowerCase().includes("expired") ||
      sessionError.toLowerCase().includes("otp") ||
      sessionError.toLowerCase().includes("invalid")
    return expired ? loginExpiredRedirect(origin) : NextResponse.redirect(`${origin}/login`)
  }

  if (next === SET_PASSWORD_PATH) {
    return NextResponse.redirect(`${origin}${SET_PASSWORD_PATH}`)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const clinicReady = await therapistHasClinicProfile(supabase, user.id)
    if (!clinicReady) {
      return NextResponse.redirect(`${origin}/onboarding`)
    }
  }

  return NextResponse.redirect(`${origin}${next === "/onboarding" ? "/dashboard" : next}`)
}
