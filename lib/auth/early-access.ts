import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_COOKIE_VALUE,
  EARLY_ACCESS_MAX_AGE_SECONDS,
} from "./early-access-constants.ts"

export {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_COOKIE_VALUE,
  EARLY_ACCESS_MAX_AGE_SECONDS,
  EARLY_ACCESS_TTL_DAYS,
} from "./early-access-constants.ts"

export type EarlyAccessCookieOptions = {
  httpOnly: true
  sameSite: "lax"
  secure: boolean
  path: "/"
  maxAge: number
  expires: Date
}

export function earlyAccessCookieSecure(forwardedProto?: string | null): boolean {
  const proto = forwardedProto?.split(",")[0]?.trim().toLowerCase()
  if (proto === "https") {
    return true
  }
  if (proto === "http") {
    return false
  }
  return process.env.NODE_ENV === "production"
}

export function earlyAccessCookieOptions(forwardedProto?: string | null): EarlyAccessCookieOptions {
  const maxAge = EARLY_ACCESS_MAX_AGE_SECONDS
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: earlyAccessCookieSecure(forwardedProto),
    path: "/",
    maxAge,
    expires: new Date(Date.now() + maxAge * 1000),
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

export function stampEarlyAccessCookie(
  setCookie: (name: string, value: string, options: EarlyAccessCookieOptions) => void,
  forwardedProto?: string | null,
) {
  setCookie(EARLY_ACCESS_COOKIE, EARLY_ACCESS_COOKIE_VALUE, earlyAccessCookieOptions(forwardedProto))
}

/** Reaplică flag-ul cu maxAge 90 de zile, ca redirecturile să nu-l transforme în cookie de sesiune. */
export function applyEarlyAccessCookie(
  request: {
    cookies: { get: (name: string) => { value: string } | undefined }
    headers?: { get: (name: string) => string | null }
    nextUrl?: { protocol: string }
  },
  setCookie: (name: string, value: string, options: EarlyAccessCookieOptions) => void,
) {
  if (!request.cookies.get(EARLY_ACCESS_COOKIE)?.value) {
    return
  }
  const proto =
    request.headers?.get("x-forwarded-proto") ??
    (request.nextUrl?.protocol === "https:" ? "https" : request.nextUrl?.protocol === "http:" ? "http" : null)
  stampEarlyAccessCookie(setCookie, proto)
}
