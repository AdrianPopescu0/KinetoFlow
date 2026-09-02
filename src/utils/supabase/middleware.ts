import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

import { therapistHasClinicProfile } from "@/lib/clinics/profile"
import { PATIENT_SESSION_COOKIE, patientTokenFromPath } from "@/lib/patients/session"
import { getSupabasePublicEnv, isUnconfiguredSupabaseUrl } from "@/utils/supabase/env"

const PROTECTED_PREFIX = "/dashboard"

function isProtectedPath(pathname: string): boolean {
  return pathname === PROTECTED_PREFIX || pathname.startsWith(`${PROTECTED_PREFIX}/`)
}

function isTherapistAuthPage(pathname: string): boolean {
  return pathname === "/login" || pathname === "/register" || pathname === "/recuperare-parola"
}

function isOnboardingPath(pathname: string): boolean {
  return pathname === "/onboarding" || pathname.startsWith("/onboarding/")
}

function patientPortalGuard(request: NextRequest): NextResponse | null {
  const token = patientTokenFromPath(request.nextUrl.pathname)
  if (!token) {
    return null
  }

  const session = request.cookies.get(PATIENT_SESSION_COOKIE)?.value
  if (session === token) {
    return null
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = "/acces"
  redirectUrl.search = ""
  redirectUrl.searchParams.set("redirectTo", `/p/${token}`)
  return NextResponse.redirect(redirectUrl)
}

export async function updateSession(request: NextRequest) {
  const blocked = patientPortalGuard(request)
  if (blocked) {
    return blocked
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const { url, anonKey } = getSupabasePublicEnv()
  const pathname = request.nextUrl.pathname

  if (isUnconfiguredSupabaseUrl(url)) {
    if (isProtectedPath(pathname) || isOnboardingPath(pathname)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/login"
      redirectUrl.searchParams.set("redirectTo", pathname)
      return NextResponse.redirect(redirectUrl)
    }

    return supabaseResponse
  }

  const supabase = createServerClient(url, anonKey, {
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
          supabaseResponse.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  const authenticatedUser = userError ? null : user

  if (!authenticatedUser && (isProtectedPath(pathname) || isOnboardingPath(pathname))) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = "/login"
    redirectUrl.searchParams.set("redirectTo", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (authenticatedUser) {
    const clinicReady = await therapistHasClinicProfile(supabase, authenticatedUser.id)

    if (isTherapistAuthPage(pathname)) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = clinicReady ? "/dashboard" : "/onboarding"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }

    if (isOnboardingPath(pathname) && clinicReady) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/dashboard"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }

    if (isProtectedPath(pathname) && !clinicReady) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = "/onboarding"
      redirectUrl.search = ""
      return NextResponse.redirect(redirectUrl)
    }
  }

  return supabaseResponse
}
