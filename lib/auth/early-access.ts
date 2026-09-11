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

type EarlyAccessCookieSet = (
  name: string,
  value: string,
  options: { path: "/"; maxAge: number },
) => void

/** Sets `early_access_verified=1` with path `/` and maxAge 90 days. */
export function stampEarlyAccessCookie(
  setCookie: EarlyAccessCookieSet,
  _forwardedProto?: string | null,
) {
  setCookie(EARLY_ACCESS_COOKIE, EARLY_ACCESS_COOKIE_VALUE, {
    path: "/",
    maxAge: EARLY_ACCESS_MAX_AGE_SECONDS,
  })
}

export function applyEarlyAccessCookie(
  request: {
    cookies: { get: (name: string) => { value: string } | undefined }
  },
  setCookie: EarlyAccessCookieSet,
) {
  if (!request.cookies.get(EARLY_ACCESS_COOKIE)?.value) {
    return
  }
  stampEarlyAccessCookie(setCookie)
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
