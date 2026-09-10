import { isTherapistInviteToken, THERAPIST_INVITE_PATH } from "./therapist-invite-token.ts"

export const THERAPIST_INVITE_COOKIE = "kf_therapist_invite"
export const THERAPIST_INVITE_STORAGE_KEY = "kf_therapist_invite"
export const THERAPIST_INVITE_FINALIZE_PATH = `${THERAPIST_INVITE_PATH}/finalize`
export const THERAPIST_INVITE_CONTINUE_PATH = `${THERAPIST_INVITE_PATH}/continue`

const INVITE_COOKIE_MAX_AGE = 14 * 24 * 60 * 60

export function therapistInviteCookieOptions(maxAge = INVITE_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export function inviteTokenFromPathname(pathname: string): string | null {
  if (!pathname.startsWith(`${THERAPIST_INVITE_PATH}/`)) {
    return null
  }
  const raw = decodeURIComponent(pathname.slice(THERAPIST_INVITE_PATH.length + 1).split("/")[0] ?? "").trim()
  if (!raw || raw === "finalize" || raw === "continue") {
    return null
  }
  return isTherapistInviteToken(raw) ? raw : null
}

export function isInviteFinalizePath(pathname: string): boolean {
  return pathname === THERAPIST_INVITE_FINALIZE_PATH || pathname.startsWith(`${THERAPIST_INVITE_FINALIZE_PATH}/`)
}

export function isInviteContinuePath(pathname: string): boolean {
  return pathname === THERAPIST_INVITE_CONTINUE_PATH || pathname.startsWith(`${THERAPIST_INVITE_CONTINUE_PATH}/`)
}

export function readTherapistInviteToken(
  queryInvite: string | null | undefined,
  cookieInvite?: string | null,
): string | null {
  for (const value of [queryInvite, cookieInvite]) {
    const token = typeof value === "string" ? value.trim() : ""
    if (isTherapistInviteToken(token)) {
      return token
    }
  }
  return null
}

export function persistTherapistInviteToken(token: string) {
  if (typeof window === "undefined" || !isTherapistInviteToken(token)) {
    return
  }
  window.localStorage.setItem(THERAPIST_INVITE_STORAGE_KEY, token)
}

export function readStoredTherapistInviteToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  const value = window.localStorage.getItem(THERAPIST_INVITE_STORAGE_KEY)
  return value && isTherapistInviteToken(value) ? value : null
}

export function clearStoredTherapistInviteToken() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(THERAPIST_INVITE_STORAGE_KEY)
}

export function therapistInviteFinalizeHref(token: string): string {
  return `${THERAPIST_INVITE_FINALIZE_PATH}?invite=${encodeURIComponent(token)}`
}

/** Script inline: salvează tokenul în localStorage înainte de hidratare sau click pe Google. */
export function therapistInvitePersistScript(token: string): string {
  if (!isTherapistInviteToken(token)) {
    return ""
  }
  return `try{localStorage.setItem(${JSON.stringify(THERAPIST_INVITE_STORAGE_KEY)},${JSON.stringify(token)})}catch(e){}`
}

/** După login/OAuth, invitația în așteptare bate ecranul de clinică nouă. */
export function therapistPostAuthHref(
  next?: string | null,
  storedInvite?: string | null,
): string {
  if (storedInvite && isTherapistInviteToken(storedInvite)) {
    return therapistInviteFinalizeHref(storedInvite)
  }
  return next === "/onboarding" ? THERAPIST_INVITE_CONTINUE_PATH : "/dashboard"
}
