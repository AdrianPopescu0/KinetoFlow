export const PATIENT_SESSION_COOKIE = "kf_patient_access"
export const PATIENT_RESUME_COOKIE = "kf_patient_resume"
export const PATIENT_TOKEN_STORAGE_KEY = "kf_patient_token"

const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const patientSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
}

/** Session cookies set from a magic-link URL (no Max-Age). */
export const patientUrlAccessCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export const patientResumeCookieOptions = {
  httpOnly: false,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export function looksLikePatientToken(token: string): boolean {
  return TOKEN_PATTERN.test(token)
}

/** Token UUID din tabela patients — portalul real (nu demo). */
export function isPatientUuidToken(token: string): boolean {
  return UUID_PATTERN.test(token)
}

export function patientPublicPath(token: string): string {
  return `/patient/${token}`
}

export function isPatientBarePath(pathname: string): boolean {
  return pathname === "/patient" || pathname === "/patient/" || pathname === "/p" || pathname === "/p/"
}

export function patientTokenFromPath(pathname: string): string | null {
  for (const prefix of ["/patient/", "/p/"] as const) {
    if (!pathname.startsWith(prefix)) {
      continue
    }
    const token = pathname.slice(prefix.length).split("/")[0]?.trim()
    return token && token.length > 0 ? token : null
  }
  return null
}

export function isSafePatientRedirect(value: string | null): value is string {
  if (!value) {
    return false
  }
  return /^\/(p|patient)\/[a-zA-Z0-9_-]{4,64}$/.test(value)
}
