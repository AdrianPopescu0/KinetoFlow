import {
  persistTherapistInviteToken,
  readStoredTherapistInviteToken,
  therapistPostAuthHref,
  THERAPIST_INVITE_PATH,
} from "../clinics/invite-session.ts"
import { resolveAppOrigin } from "./site-origin.ts"

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
  const invite = readStoredTherapistInviteToken()
  if (invite) {
    persistTherapistInviteToken(invite)
  }
  window.location.assign(therapistPostAuthHref(next, invite))
}

export function oauthBrowserRedirectTo(
  origin: string,
  options?: { next?: string; invite?: string },
): string {
  const resolved = resolveAppOrigin({
    requestOrigin: origin,
    envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
  const url = new URL("/auth/callback", resolved)
  url.searchParams.set("next", options?.next ?? "/dashboard")
  if (options?.invite) {
    url.searchParams.set("invite", options.invite)
  }
  return url.toString()
}

export function oauthBrowserRedirectToWithPendingInvite(
  origin: string,
  fallbackNext: "/dashboard" | "/onboarding" = "/dashboard",
): string {
  const invite = readStoredTherapistInviteToken()
  if (invite) {
    persistTherapistInviteToken(invite)
  }
  return oauthBrowserRedirectTo(origin, {
    next: invite ? `${THERAPIST_INVITE_PATH}/${invite}` : fallbackNext,
    invite: invite ?? undefined,
  })
}
