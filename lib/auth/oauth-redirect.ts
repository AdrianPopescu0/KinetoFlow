export const SIGNED_OUT_GATE_COOKIE = "kf_signed_out"

export function isSupabaseAuthCookieName(name: string): boolean {
  return name.startsWith("sb-") && (name.includes("-auth-token") || name.includes("code-verifier"))
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
