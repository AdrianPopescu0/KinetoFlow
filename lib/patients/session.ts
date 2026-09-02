export const PATIENT_SESSION_COOKIE = "kf_patient_access"

export const patientSessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
}

export function patientTokenFromPath(pathname: string): string | null {
  if (!pathname.startsWith("/p/")) {
    return null
  }
  const token = pathname.slice("/p/".length).split("/")[0]?.trim()
  return token && token.length > 0 ? token : null
}

export function isSafePatientRedirect(value: string | null): value is string {
  if (!value) {
    return false
  }
  return /^\/p\/[a-zA-Z0-9_-]{4,64}$/.test(value)
}
