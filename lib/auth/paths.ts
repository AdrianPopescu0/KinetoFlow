import { inviteTokenFromPathname } from "../clinics/invite-session.ts"

export function isSignupAuthMode(search: { mode?: string; tab?: string } | null | undefined): boolean {
  if (!search) {
    return false
  }
  return search.mode === "signup" || search.tab === "register"
}

export function loginHref(mode: "signin" | "signup"): string {
  return mode === "signup" ? "/login?mode=signup" : "/login?mode=signin"
}

export function emailOtpPageHref(email: string, purpose: "register" = "register"): string {
  const params = new URLSearchParams({
    email,
    purpose,
  })
  return `/auth/email-cod?${params.toString()}`
}

export const LOGIN_SIGNED_OUT_HREF = "/login?signedout=1"

export function shouldStayOnTherapistLogin(search: string | URLSearchParams | null | undefined): boolean {
  if (!search) {
    return false
  }
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search
  return params.get("signedout") === "1"
}

export function isPublicMarketingPath(pathname: string): boolean {
  return pathname === "/" || pathname === "/early-access"
}

export function therapistAppPath(clinicReady: boolean): "/dashboard" | "/onboarding" {
  return clinicReady ? "/dashboard" : "/onboarding"
}

export const SET_PASSWORD_PATH = "/auth/set-password"

export function safeAuthNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null
  }
  const pathOnly = next.split("?")[0] ?? next
  if (inviteTokenFromPathname(pathOnly)) {
    return pathOnly
  }
  if (
    pathOnly === "/onboarding" ||
    pathOnly === "/dashboard" ||
    pathOnly === SET_PASSWORD_PATH ||
    pathOnly.startsWith("/dashboard/") ||
    pathOnly === "/auth/invitatie/continue" ||
    pathOnly === "/auth/invitatie/finalize" ||
    pathOnly.startsWith("/auth/invitatie/continue") ||
    pathOnly.startsWith("/auth/invitatie/finalize")
  ) {
    return pathOnly
  }
  return null
}
