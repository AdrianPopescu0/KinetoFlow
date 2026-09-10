import { isTherapistInviteToken, THERAPIST_INVITE_PATH } from "./therapist-invite-token.ts"

export { THERAPIST_INVITE_PATH }

export const THERAPIST_INVITE_COOKIE = "kf_therapist_invite"
export const THERAPIST_INVITE_CLIENT_COOKIE = "kf_invite"
export const THERAPIST_INVITE_STORAGE_KEY = "kf_therapist_invite"
export const THERAPIST_INVITE_FINALIZE_PATH = `${THERAPIST_INVITE_PATH}/finalize`
export const THERAPIST_INVITE_CONTINUE_PATH = `${THERAPIST_INVITE_PATH}/continue`

const INVITE_COOKIE_MAX_AGE = 14 * 24 * 60 * 60

export type TherapistInviteCookieOptions = {
  httpOnly: boolean
  sameSite: "lax"
  secure: boolean
  path: string
  maxAge: number
}

export function therapistInviteCookieOptions(maxAge = INVITE_COOKIE_MAX_AGE): TherapistInviteCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

export function therapistInviteClientCookieOptions(maxAge = INVITE_COOKIE_MAX_AGE): TherapistInviteCookieOptions {
  return {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  }
}

type InviteCookieWriter = (name: string, value: string, options: TherapistInviteCookieOptions) => void

export function writeTherapistInviteCookies(setCookie: InviteCookieWriter, token: string) {
  if (!isTherapistInviteToken(token)) {
    return
  }
  setCookie(THERAPIST_INVITE_COOKIE, token, therapistInviteCookieOptions())
  setCookie(THERAPIST_INVITE_CLIENT_COOKIE, token, therapistInviteClientCookieOptions())
}

export function clearTherapistInviteCookies(setCookie: InviteCookieWriter) {
  setCookie(THERAPIST_INVITE_COOKIE, "", { ...therapistInviteCookieOptions(), maxAge: 0 })
  setCookie(THERAPIST_INVITE_CLIENT_COOKIE, "", { ...therapistInviteClientCookieOptions(), maxAge: 0 })
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
  ...values: Array<string | null | undefined>
): string | null {
  for (const value of values) {
    const token = typeof value === "string" ? value.trim() : ""
    if (isTherapistInviteToken(token)) {
      return token
    }
  }
  return null
}

export function inviteTokenFromAuthUser(user: {
  user_metadata?: unknown
  app_metadata?: unknown
} | null | undefined): string | null {
  if (!user) {
    return null
  }
  const userMeta = user.user_metadata && typeof user.user_metadata === "object"
    ? (user.user_metadata as Record<string, unknown>)
    : {}
  const appMeta = user.app_metadata && typeof user.app_metadata === "object"
    ? (user.app_metadata as Record<string, unknown>)
    : {}
  return readTherapistInviteToken(
    typeof userMeta.invite_token === "string" ? userMeta.invite_token : null,
    typeof appMeta.invite_token === "string" ? appMeta.invite_token : null,
  )
}

function writeClientInviteCookie(token: string) {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  document.cookie = `${THERAPIST_INVITE_CLIENT_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${INVITE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`
}

function readClientInviteCookie(): string | null {
  const parts = document.cookie.split("; ")
  for (const part of parts) {
    if (!part.startsWith(`${THERAPIST_INVITE_CLIENT_COOKIE}=`)) {
      continue
    }
    try {
      return decodeURIComponent(part.slice(THERAPIST_INVITE_CLIENT_COOKIE.length + 1))
    } catch {
      return part.slice(THERAPIST_INVITE_CLIENT_COOKIE.length + 1)
    }
  }
  return null
}

export function persistTherapistInviteToken(token: string) {
  if (typeof window === "undefined" || !isTherapistInviteToken(token)) {
    return
  }
  window.localStorage.setItem(THERAPIST_INVITE_STORAGE_KEY, token)
  window.sessionStorage.setItem(THERAPIST_INVITE_STORAGE_KEY, token)
  writeClientInviteCookie(token)
}

export function readStoredTherapistInviteToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return readTherapistInviteToken(
    window.localStorage.getItem(THERAPIST_INVITE_STORAGE_KEY),
    window.sessionStorage.getItem(THERAPIST_INVITE_STORAGE_KEY),
    readClientInviteCookie(),
  )
}

export function clearStoredTherapistInviteToken() {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.removeItem(THERAPIST_INVITE_STORAGE_KEY)
  window.sessionStorage.removeItem(THERAPIST_INVITE_STORAGE_KEY)
  document.cookie = `${THERAPIST_INVITE_CLIENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`
}

export function therapistInviteFinalizeHref(token: string): string {
  return `${THERAPIST_INVITE_FINALIZE_PATH}?invite=${encodeURIComponent(token)}`
}

/** Script inline: salvează tokenul în localStorage, sessionStorage și cookie înainte de hidratare sau Google. */
export function therapistInvitePersistScript(token: string): string {
  if (!isTherapistInviteToken(token)) {
    return ""
  }
  return `try{var t=${JSON.stringify(token)};var k=${JSON.stringify(THERAPIST_INVITE_STORAGE_KEY)};localStorage.setItem(k,t);sessionStorage.setItem(k,t);document.cookie=${JSON.stringify(THERAPIST_INVITE_CLIENT_COOKIE)}+"="+encodeURIComponent(t)+"; Path=/; Max-Age=${INVITE_COOKIE_MAX_AGE}; SameSite=Lax"+(location.protocol==="https:"?"; Secure":"")}catch(e){}`
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
