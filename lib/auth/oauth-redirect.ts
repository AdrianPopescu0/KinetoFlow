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

/** Pe mobil, Google trebuie să arate mereu selectorul de conturi. */
export const GOOGLE_OAUTH_QUERY_PARAMS = {
  prompt: "select_account",
} as const

export function therapistEnterPath(next?: string | null): "/dashboard" | "/onboarding" {
  return next === "/onboarding" ? "/onboarding" : "/dashboard"
}

const THERAPIST_APP_ENTER_GUARD = "kf_therapist_app_enter"
const THERAPIST_APP_ENTER_LIMIT = 2

export type TherapistBrowserSession = {
  access_token: string
  refresh_token: string
}

type BrowserAuthClient = {
  auth: {
    setSession: (
      session: TherapistBrowserSession,
    ) => Promise<{ error: { message: string } | null }>
    getSession: () => Promise<{ data: { session: TherapistBrowserSession | null } }>
  }
}

export function therapistClientSessionFrom(
  session: { access_token?: string | null; refresh_token?: string | null } | null | undefined,
): TherapistBrowserSession | null {
  const access_token = session?.access_token?.trim() ?? ""
  const refresh_token = session?.refresh_token?.trim() ?? ""
  if (!access_token || !refresh_token) {
    return null
  }
  return { access_token, refresh_token }
}

export function clearTherapistAppEnterGuard() {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.sessionStorage.removeItem(THERAPIST_APP_ENTER_GUARD)
  } catch {
    // Safari privat / storage blocat
  }
}

export function canEnterTherapistApp(storage: Pick<Storage, "getItem" | "setItem"> | null = null): boolean {
  const store =
    storage ??
    (typeof window === "undefined"
      ? null
      : (() => {
          try {
            return window.sessionStorage
          } catch {
            return null
          }
        })())
  if (!store) {
    return true
  }
  try {
    const raw = store.getItem(THERAPIST_APP_ENTER_GUARD)
    const count = raw ? Number.parseInt(raw, 10) : 0
    const next = Number.isFinite(count) ? count : 0
    if (next >= THERAPIST_APP_ENTER_LIMIT) {
      return false
    }
    store.setItem(THERAPIST_APP_ENTER_GUARD, String(next + 1))
    return true
  } catch {
    return true
  }
}

/** Navigare de document după ce sesiunea e în cookie-uri / storage. */
export function enterTherapistApp(next?: string | null) {
  if (typeof window === "undefined") {
    return
  }
  if (!canEnterTherapistApp()) {
    return
  }
  const invite = readStoredTherapistInviteToken()
  if (invite) {
    persistTherapistInviteToken(invite)
  }
  window.location.replace(therapistPostAuthHref(next, invite))
}

/**
 * Scrie tokenii în client (cookie + storage) și abia apoi duce terapeutul
 * în aplicație. Fără asta, mobilul poate naviga înainte să se salveze sesiunea
 * și middleware-ul îl aruncă înapoi pe landing/login.
 */
export async function persistTherapistSessionAndEnter(
  supabase: BrowserAuthClient,
  next?: string | null,
  session?: TherapistBrowserSession | null,
): Promise<boolean> {
  if (session?.access_token && session.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    })
    if (error) {
      return false
    }
  }
  const { data } = await supabase.auth.getSession()
  if (!data.session?.access_token || !data.session.refresh_token) {
    return false
  }
  enterTherapistApp(next)
  return true
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
