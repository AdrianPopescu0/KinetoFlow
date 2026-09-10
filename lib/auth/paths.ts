export function isSignupAuthMode(search: { mode?: string; tab?: string } | null | undefined): boolean {
  if (!search) {
    return false
  }
  return search.mode === "signup" || search.tab === "register"
}

export function loginHref(mode: "signin" | "signup"): string {
  return mode === "signup" ? "/login?mode=signup" : "/login?mode=signin"
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
  if (
    next === "/onboarding" ||
    next === "/dashboard" ||
    next === SET_PASSWORD_PATH ||
    next.startsWith("/dashboard/")
  ) {
    return next
  }
  return null
}
