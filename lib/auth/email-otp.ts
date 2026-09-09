import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto"

export const EMAIL_OTP_LENGTH = 6
export const EMAIL_OTP_TTL_MS = 10 * 60 * 1000
export const EMAIL_OTP_RESEND_MS = 45 * 1000
export const EMAIL_OTP_MAX_ATTEMPTS = 5

export type AuthEmailOtpPurpose = "login" | "register"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function normalizeAuthEmail(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }
  const email = value.trim().toLowerCase()
  if (!EMAIL_PATTERN.test(email) || email.length > 160) {
    return null
  }
  return email
}

export function parseAuthEmailOtpPurpose(value: unknown): AuthEmailOtpPurpose {
  return value === "register" ? "register" : "login"
}

export function generateEmailOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(EMAIL_OTP_LENGTH, "0")
}

export function isEmailOtpCode(value: string): boolean {
  return new RegExp(`^\\d{${EMAIL_OTP_LENGTH}}$`).test(value.trim())
}

export function generateEmailOtpLinkToken(): string {
  return randomBytes(32).toString("base64url")
}

export function emailOtpPepper(): string {
  return (
    process.env.AUTH_OTP_PEPPER?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "kinetoflow-auth-otp"
  )
}

export function hashEmailOtpCode(email: string, code: string, pepper = emailOtpPepper()): string {
  return createHash("sha256").update(`code:${pepper}:${email}:${code.trim()}`).digest("hex")
}

export function hashEmailOtpLinkToken(token: string, pepper = emailOtpPepper()): string {
  return createHash("sha256").update(`link:${pepper}:${token.trim()}`).digest("hex")
}

export function hashesMatch(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length || a.length === 0) {
    return false
  }
  return timingSafeEqual(a, b)
}

export function signVerifiedEmailCookie(email: string, expiresAtMs: number, pepper = emailOtpPepper()): string {
  const payload = `${expiresAtMs}.${email}`
  const signature = createHmac("sha256", pepper).update(payload).digest("base64url")
  return `${expiresAtMs}.${signature}.${email}`
}

export function readVerifiedEmailCookie(
  value: string | null | undefined,
  nowMs = Date.now(),
  pepper = emailOtpPepper(),
): string | null {
  if (!value) {
    return null
  }
  const firstDot = value.indexOf(".")
  const secondDot = value.indexOf(".", firstDot + 1)
  if (firstDot < 1 || secondDot < 0) {
    return null
  }
  const expiresAtMs = Number(value.slice(0, firstDot))
  const signature = value.slice(firstDot + 1, secondDot)
  const email = value.slice(secondDot + 1)
  if (!signature || !Number.isFinite(expiresAtMs) || expiresAtMs < nowMs) {
    return null
  }
  const expected = createHmac("sha256", pepper).update(`${expiresAtMs}.${email}`).digest("base64url")
  if (!hashesMatch(signature, expected)) {
    return null
  }
  return normalizeAuthEmail(email)
}

export function otpExpiresAt(now = new Date(), ttlMs = EMAIL_OTP_TTL_MS): Date {
  return new Date(now.getTime() + ttlMs)
}
