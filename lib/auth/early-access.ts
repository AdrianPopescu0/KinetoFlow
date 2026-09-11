import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_FALLBACK_PEPPER,
  EARLY_ACCESS_TTL_MS,
} from "./early-access-constants.ts"

export {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_FALLBACK_PEPPER,
  EARLY_ACCESS_TTL_DAYS,
  EARLY_ACCESS_TTL_MS,
} from "./early-access-constants.ts"

export type EarlyAccessCookieOptions = {
  httpOnly: true
  sameSite: "lax"
  secure: boolean
  path: "/"
  maxAge: number
  expires: Date
}

function uniqueNonEmpty(values: Array<string | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value?.trim()
    if (!trimmed || seen.has(trimmed)) {
      continue
    }
    seen.add(trimmed)
    result.push(trimmed)
  }
  return result
}

/** Pepper disponibil și în Edge (middleware), fără SERVICE_ROLE_KEY. */
export function earlyAccessSigningPepper(): string {
  return (
    process.env.EARLY_ACCESS_PEPPER?.trim() ||
    process.env.AUTH_OTP_PEPPER?.trim() ||
    EARLY_ACCESS_FALLBACK_PEPPER
  )
}

/** Verifică și cookie-urile vechi semnate cu service role, dacă cheia e prezentă. */
export function earlyAccessVerifyPeppers(): string[] {
  return uniqueNonEmpty([
    process.env.EARLY_ACCESS_PEPPER,
    process.env.AUTH_OTP_PEPPER,
    EARLY_ACCESS_FALLBACK_PEPPER,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    process.env.SUPABASE_SECRET_KEY,
  ])
}

export function earlyAccessCookieOptions(expiresAtMs: number): EarlyAccessCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.max(1, Math.floor((expiresAtMs - Date.now()) / 1000)),
    expires: new Date(expiresAtMs),
  }
}

export function configuredEarlyAccessCode(): string {
  const raw = process.env.EARLY_ACCESS_CODE?.trim()
  if (raw && raw.length === EARLY_ACCESS_CODE_LENGTH) {
    return raw
  }
  return DEFAULT_EARLY_ACCESS_CODE
}

export function normalizeEarlyAccessCode(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

function timingSafeEqualBytes(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < left.length; i += 1) {
    diff |= left[i]! ^ right[i]!
  }
  return diff === 0
}

function bytesFromText(value: string): Uint8Array<ArrayBuffer> {
  return new TextEncoder().encode(value)
}

export function isValidEarlyAccessCode(
  input: unknown,
  expected = configuredEarlyAccessCode(),
): boolean {
  const code = normalizeEarlyAccessCode(input)
  if (code.length !== EARLY_ACCESS_CODE_LENGTH || expected.length !== EARLY_ACCESS_CODE_LENGTH) {
    return false
  }
  return timingSafeEqualBytes(bytesFromText(code), bytesFromText(expected))
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/")
    const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4))
    const binary = atob(padded + pad)
    return Uint8Array.from(binary, (char) => char.charCodeAt(0))
  } catch {
    return null
  }
}

async function hmacSha256(secret: string, payload: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    bytesFromText(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const signature = await crypto.subtle.sign("HMAC", key, bytesFromText(payload))
  return new Uint8Array(signature)
}

export async function signEarlyAccessCookie(
  expiresAtMs: number,
  secret = earlyAccessSigningPepper(),
): Promise<string> {
  const signature = await hmacSha256(secret, `early.${expiresAtMs}`)
  return `${expiresAtMs}.${toBase64Url(signature)}`
}

export async function hasValidEarlyAccessCookie(
  value: string | null | undefined,
  nowMs = Date.now(),
  secret?: string | string[],
): Promise<boolean> {
  if (!value) {
    return false
  }
  const dot = value.indexOf(".")
  if (dot < 1) {
    return false
  }
  const expiresAtMs = Number(value.slice(0, dot))
  const signature = value.slice(dot + 1)
  if (!signature || !Number.isFinite(expiresAtMs) || expiresAtMs < nowMs) {
    return false
  }
  const received = fromBase64Url(signature)
  if (!received) {
    return false
  }
  const secrets = secret == null ? earlyAccessVerifyPeppers() : Array.isArray(secret) ? secret : [secret]
  for (const candidate of secrets) {
    const expected = await hmacSha256(candidate, `early.${expiresAtMs}`)
    if (timingSafeEqualBytes(received, expected)) {
      return true
    }
  }
  return false
}

export async function writeEarlyAccessCookie(
  setCookie: (name: string, value: string, options: EarlyAccessCookieOptions) => void,
  nowMs = Date.now(),
): Promise<number> {
  const expiresAtMs = nowMs + EARLY_ACCESS_TTL_MS
  setCookie(EARLY_ACCESS_COOKIE, await signEarlyAccessCookie(expiresAtMs), earlyAccessCookieOptions(expiresAtMs))
  return expiresAtMs
}
