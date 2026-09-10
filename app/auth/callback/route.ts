import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import type { EmailOtpType } from "@supabase/supabase-js"

import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { SET_PASSWORD_PATH, safeAuthNextPath, therapistAppPath } from "@/lib/auth/paths"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { readTherapistInviteToken, therapistInvitePagePath } from "@/lib/clinics/invite-attach"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import type { Database } from "@/lib/supabase/database.types"
import { getSupabasePublicEnv } from "@/utils/supabase/env"

export const dynamic = "force-dynamic"

type SessionCookie = {
  name: string
  value: string
  options?: Parameters<NextResponse["cookies"]["set"]>[2]
}

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

function callbackAbsoluteUrl(request: NextRequest, path: string) {
  const forwardedHost = request.headers.get("x-forwarded-host")
  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return `https://${forwardedHost}${path}`
  }
  return `${request.nextUrl.origin}${path}`
}

function redirectWithCookies(request: NextRequest, path: string, cookiesToSet: SessionCookie[]) {
  const response = NextResponse.redirect(callbackAbsoluteUrl(request, path), 303)
  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, { ...options, path: "/" })
  }
  return response
}

/**
 * PKCE / email callback: `?code=` → `exchangeCodeForSession`, apoi redirect
 * spre dashboard, onboarding sau setarea parolei. Cookie-urile de sesiune
 * trebuie puse pe răspunsul de redirect, altfel utilizatorul ajunge delogat.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get("code")
  const tokenHash = searchParams.get("token_hash")
  const otpType = searchParams.get("type")
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error")
  const next = safeAuthNextPath(searchParams.get("next")) ?? "/dashboard"
  const inviteToken = readTherapistInviteToken(searchParams.get("invite"))

  if (errorCode === "otp_expired") {
    return NextResponse.redirect(callbackAbsoluteUrl(request, "/login?reason=otp_expired"))
  }

  if (errorCode && !code && !(tokenHash && isEmailOtpType(otpType))) {
    if (inviteToken) {
      return NextResponse.redirect(callbackAbsoluteUrl(request, therapistInvitePagePath(inviteToken, "oauth")))
    }
    return NextResponse.redirect(callbackAbsoluteUrl(request, "/login?reason=oauth"))
  }

  if (!code && !(tokenHash && isEmailOtpType(otpType))) {
    if (inviteToken) {
      return NextResponse.redirect(callbackAbsoluteUrl(request, therapistInvitePagePath(inviteToken, "oauth")))
    }
    return NextResponse.redirect(callbackAbsoluteUrl(request, "/login"))
  }

  const sessionCookies: SessionCookie[] = []
  const { url, anonKey } = getSupabasePublicEnv()
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        const merged = new Map(request.cookies.getAll().map((cookie) => [cookie.name, cookie]))
        for (const cookie of sessionCookies) {
          merged.set(cookie.name, { name: cookie.name, value: cookie.value })
        }
        return Array.from(merged.values())
      },
      setAll(cookiesToSet) {
        sessionCookies.push(...cookiesToSet)
      },
    },
  })

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
  }

  if (sessionError) {
    const expired =
      sessionError.toLowerCase().includes("expired") ||
      sessionError.toLowerCase().includes("otp") ||
      sessionError.toLowerCase().includes("invalid")
    if (inviteToken) {
      return NextResponse.redirect(
        callbackAbsoluteUrl(request, therapistInvitePagePath(inviteToken, expired ? "expired" : "oauth")),
      )
    }
    return NextResponse.redirect(
      callbackAbsoluteUrl(request, expired ? "/login?reason=otp_expired" : "/login"),
    )
  }

  if (next === SET_PASSWORD_PATH) {
    return redirectWithCookies(request, SET_PASSWORD_PATH, sessionCookies)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user && !isEmailConfirmedUser(user)) {
    if (inviteToken) {
      return redirectWithCookies(request, therapistInvitePagePath(inviteToken, "failed"), sessionCookies)
    }
    return redirectWithCookies(request, "/login?reason=confirm_email", sessionCookies)
  }

  if (inviteToken) {
    if (!user) {
      return redirectWithCookies(request, therapistInvitePagePath(inviteToken, "oauth"), sessionCookies)
    }

    const attached = await attachTherapistInviteToUser({ token: inviteToken, user })
    if (!attached.ok) {
      await supabase.auth.signOut()
      return redirectWithCookies(request, therapistInvitePagePath(inviteToken, attached.reason), sessionCookies)
    }

    return redirectWithCookies(request, "/dashboard", sessionCookies)
  }

  if (user) {
    const clinicReady = clinicReadyFromUser(user) || (await therapistHasClinicProfile(supabase, user.id))
    if (!clinicReady) {
      return redirectWithCookies(request, therapistAppPath(false), sessionCookies)
    }
  }

  const destination = next === "/onboarding" ? therapistAppPath(true) : next
  return redirectWithCookies(request, destination, sessionCookies)
}
