import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { EARLY_ACCESS_COOKIE, hasValidEarlyAccessCookie } from "@/lib/auth/early-access"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { isPublicMarketingPath, therapistAppPath } from "@/lib/auth/paths"
import { redirectWithAuthCookies } from "@/lib/auth/session-response"
import { clinicReadyFromUser, therapistHasClinicProfile } from "@/lib/clinics/profile"
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
    pathname === "/early-access/cont"
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

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, { ...options, path: "/" })
        })
        if (urlToken) {
          stampPatientCookies(supabaseResponse, urlToken)
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
    const clinicReady = clinicReadyFromUser(authenticatedUser)
      ? true
      : await therapistHasClinicProfile(supabase, authenticatedUser.id)
    const appPath = therapistAppPath(clinicReady)

    if (isTherapistAuthPage(pathname) || isPublicMarketingPath(pathname)) {
      return redirectWithAuthCookies(request, supabaseResponse, appPath)
    }

    if (isOnboardingPath(pathname) && clinicReady) {
      return redirectWithAuthCookies(request, supabaseResponse, "/dashboard")
    }

    if (isProtectedPath(pathname) && !clinicReady) {
      return redirectWithAuthCookies(request, supabaseResponse, "/onboarding")
    }
  }

  return supabaseResponse
}
