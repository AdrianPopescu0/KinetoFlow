import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { EARLY_ACCESS_COOKIE, hasValidEarlyAccessCookie } from "@/lib/auth/early-access"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { isPublicMarketingPath, shouldStayOnTherapistLogin } from "@/lib/auth/paths"
import { redirectWithAuthCookies } from "@/lib/auth/session-response"
import { clinicReadyFromUser, invitedTherapistFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
import {
  THERAPIST_INVITE_CLIENT_COOKIE,
  THERAPIST_INVITE_COOKIE,
  THERAPIST_INVITE_CONTINUE_PATH,
  THERAPIST_INVITE_FINALIZE_PATH,
  clearTherapistInviteCookies,
  inviteTokenFromAuthUser,
  inviteTokenFromPathname,
  isInviteFinalizePath,
  readTherapistInviteToken,
  writeTherapistInviteCookies,
} from "@/lib/clinics/invite-session"
import {
  PATIENT_RESUME_COOKIE,
  PATIENT_SESSION_COOKIE,
  isPatientBarePath,
  looksLikePatientToken,
  patientPublicPath,
  patientResumeCookieOptions,
  patientTokenFromPath,
  patientUrlAccessCookieOptions,
} from "@/lib/patients/session"
import type { Database } from "@/lib/supabase/database.types"
import { getSupabasePublicEnv, isUnconfiguredSupabaseUrl } from "@/utils/supabase/env"

const PROTECTED_PREFIX = "/dashboard"

function isProtectedPath(pathname: string): boolean {
  return pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`)
}

function isTherapistAuthPage(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/recuperare-parola" ||
    pathname === "/early-access/cont" ||
    pathname === "/auth/email-cod" ||
    pathname.startsWith("/auth/email-cod/")
  )
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/")
}

function allowsUnconfirmedEmail(pathname: string): boolean {
  return (
    pathname === "/auth/callback" ||
    pathname.startsWith("/auth/callback/") ||
    pathname === "/auth/activare" ||
    pathname.startsWith("/auth/activare/") ||
    pathname === "/auth/email-cod" ||
    pathname.startsWith("/auth/email-cod/") ||
    pathname === "/auth/invitatie" ||
    pathname.startsWith("/auth/invitatie/") ||
    pathname.startsWith("/auth/set-password")
  )
}

function storedPatientToken(request: NextRequest): string | null {
  const access = request.cookies.get(PATIENT_SESSION_COOKIE)?.value
  if (access && looksLikePatientToken(access)) {
    return access
  }
  const resume = request.cookies.get(PATIENT_RESUME_COOKIE)?.value
  if (resume && looksLikePatientToken(resume)) {
    return resume
  }
  return null
}

async function isEarlyAccessUnlocked(request: NextRequest): Promise<boolean> {
  return hasValidEarlyAccessCookie(request.cookies.get(EARLY_ACCESS_COOKIE)?.value)
}

function redirectToEarlyAccess(request: NextRequest, source?: NextResponse): NextResponse {
  if (source) {
    return redirectWithAuthCookies(request, source, "/early-access")
  }
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = "/early-access"
  redirectUrl.search = ""
  return NextResponse.redirect(redirectUrl)
}

function stampPatientCookies(response: NextResponse, token: string): void {
  response.cookies.set(PATIENT_SESSION_COOKIE, token, patientUrlAccessCookieOptions)
  response.cookies.set(PATIENT_RESUME_COOKIE, token, patientResumeCookieOptions)
}

function stampInviteCookie(response: NextResponse, token: string): void {
  writeTherapistInviteCookies((name, value, options) => response.cookies.set(name, value, options), token)
}

function clearInviteCookie(response: NextResponse): void {
  clearTherapistInviteCookies((name, value, options) => response.cookies.set(name, value, options))
}

function pendingInviteToken(request: NextRequest, pathname: string): string | null {
  return readTherapistInviteToken(
    request.nextUrl.searchParams.get("invite"),
    inviteTokenFromPathname(pathname),
    request.cookies.get(THERAPIST_INVITE_COOKIE)?.value,
    request.cookies.get(THERAPIST_INVITE_CLIENT_COOKIE)?.value,
  )
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const urlTokenRaw = patientTokenFromPath(pathname)
  const urlToken = urlTokenRaw && looksLikePatientToken(urlTokenRaw) ? urlTokenRaw : null

  if (isPatientBarePath(pathname)) {
    const stored = storedPatientToken(request)
    if (stored) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = patientPublicPath(stored)
      redirectUrl.search = ""
      const redirect = NextResponse.redirect(redirectUrl)
      stampPatientCookies(redirect, stored)
      return redirect
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const inviteToken = pendingInviteToken(request, pathname)
  if (inviteToken) {
    stampInviteCookie(supabaseResponse, inviteToken)
  }

  if (urlToken) {
    stampPatientCookies(supabaseResponse, urlToken)
  }

  const { url, anonKey } = getSupabasePublicEnv()

  if (isUnconfiguredSupabaseUrl(url)) {
    if (isTherapistAuthPage(pathname) && !(await isEarlyAccessUnlocked(request))) {
      return redirectToEarlyAccess(request)
    }

    if (isProtectedPath(pathname) || isOnboardingPath(pathname)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  }

  const sessionCookies: Array<{ name: string; value: string; options?: Parameters<NextResponse["cookies"]["set"]>[2] }> =
    []

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
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value)
          const index = sessionCookies.findIndex((cookie) => cookie.name === name)
          const next = { name, value, options }
          if (index >= 0) {
            sessionCookies[index] = next
          } else {
            sessionCookies.push(next)
          }
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        sessionCookies.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, { ...options, path: "/" })
        })
        if (urlToken) {
          stampPatientCookies(supabaseResponse, urlToken)
        }
        if (inviteToken) {
          stampInviteCookie(supabaseResponse, inviteToken)
        }
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const authenticatedUser = userError ? null : user
  const emailConfirmed = isEmailConfirmedUser(authenticatedUser)
  const stayOnLogin = isTherapistAuthPage(pathname) && shouldStayOnTherapistLogin(request.nextUrl.searchParams)

  if (!authenticatedUser && isTherapistAuthPage(pathname) && !(await isEarlyAccessUnlocked(request))) {
    return redirectToEarlyAccess(request, supabaseResponse)
  }

  if (
    authenticatedUser &&
    !emailConfirmed &&
    !allowsUnconfirmedEmail(pathname) &&
    (isProtectedPath(pathname) || isOnboardingPath(pathname))
  ) {
    await supabase.auth.signOut()
    return redirectWithAuthCookies(request, supabaseResponse, "/login", "reason=confirm_email")
  }

  if (!authenticatedUser && (isProtectedPath(pathname) || isOnboardingPath(pathname))) {
    return redirectWithAuthCookies(
      request,
      supabaseResponse,
      "/login",
      `redirectTo=${encodeURIComponent(pathname)}`,
    )
  }

  if (authenticatedUser && emailConfirmed) {
    const invitedTherapist = invitedTherapistFromUser(authenticatedUser)
    const activeInviteToken =
      pendingInviteToken(request, pathname) ?? inviteTokenFromAuthUser(authenticatedUser)
    if (activeInviteToken && activeInviteToken !== inviteToken) {
      stampInviteCookie(supabaseResponse, activeInviteToken)
    }

    const clinicReady = clinicReadyFromUser(authenticatedUser)
      ? true
      : await therapistHasClinicProfile(supabase, authenticatedUser.id)

    if (clinicReady && activeInviteToken) {
      clearInviteCookie(supabaseResponse)
    }

    const appPath = clinicReady
      ? "/dashboard"
      : activeInviteToken
        ? THERAPIST_INVITE_FINALIZE_PATH
        : invitedTherapist
          ? "/dashboard"
          : THERAPIST_INVITE_CONTINUE_PATH

    if (!stayOnLogin && (isTherapistAuthPage(pathname) || isPublicMarketingPath(pathname))) {
      return redirectWithAuthCookies(request, supabaseResponse, appPath)
    }

    if (isOnboardingPath(pathname) && (clinicReady || invitedTherapist || activeInviteToken)) {
      if (activeInviteToken && !clinicReady) {
        return redirectWithAuthCookies(request, supabaseResponse, THERAPIST_INVITE_FINALIZE_PATH)
      }
      return redirectWithAuthCookies(request, supabaseResponse, "/dashboard")
    }

    if (isProtectedPath(pathname) && !clinicReady) {
      if (activeInviteToken && !isInviteFinalizePath(pathname)) {
        return redirectWithAuthCookies(request, supabaseResponse, THERAPIST_INVITE_FINALIZE_PATH)
      }
      if (invitedTherapist) {
        return supabaseResponse
      }
      return redirectWithAuthCookies(request, supabaseResponse, THERAPIST_INVITE_CONTINUE_PATH)
    }

    if (pathname.startsWith("/auth/invitatie/") && !isInviteFinalizePath(pathname) && activeInviteToken && !clinicReady) {
      return redirectWithAuthCookies(request, supabaseResponse, THERAPIST_INVITE_FINALIZE_PATH)
    }
  }

  return supabaseResponse
}
