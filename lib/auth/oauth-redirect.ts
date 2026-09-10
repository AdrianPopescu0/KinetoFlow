export const SIGNED_OUT_GATE_COOKIE = "kf_signed_out"

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && (name.includes("-auth-token") || name.includes("code-verifier"))
}

export function therapistEnterPath(next?: string | null): "/dashboard" | "/onboarding" {
  return next === "/onboarding" ? "/onboarding" : "/dashboard"
}

/** Navigare de document după ce acțiunea a scris cookie-urile de sesiune. */
export function enterTherapistApp(next?: string | null) {
  if (typeof window === "undefined") {
    return
  }
  window.location.assign(therapistEnterPath(next))
}

export function oauthBrowserRedirectTo(
  origin: string,
  options?: { next?: string; invite?: string },
): string {
  const url = new URL("/auth/callback", origin)
  url.searchParams.set("next", options?.next ?? "/dashboard")
  if (options?.invite) {
    url.searchParams.set("invite", options.invite)
  }
  return url.toString()
}
