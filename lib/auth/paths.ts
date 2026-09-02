export function isSignupAuthMode(search: { mode?: string; tab?: string } | null | undefined): boolean {
  if (!search) {
    return false
  }
  return search.mode === "signup" || search.tab === "register"
}

export function loginHref(mode: "signin" | "signup"): string {
  return mode === "signup" ? "/login?mode=signup" : "/login?mode=signin"
}

export function safeAuthNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null
  }
  if (next === "/onboarding" || next === "/dashboard" || next.startsWith("/dashboard/")) {
    return next
  }
  return null
}
