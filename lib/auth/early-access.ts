import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
} from "./early-access-constants.ts"

export {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_TTL_MS,
} from "./early-access-constants.ts"

function pepper(): string {
  return (
    process.env.EARLY_ACCESS_PEPPER?.trim() ||
    process.env.AUTH_OTP_PEPPER?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    "kinetoflow-early-access"
  )
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

function bytesFromText(value: string): Uint8Array {
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
  secret = pepper(),
): Promise<string> {
  const signature = await hmacSha256(secret, `early.${expiresAtMs}`)
  return `${expiresAtMs}.${toBase64Url(signature)}`
}

export async function hasValidEarlyAccessCookie(
  value: string | null | undefined,
  nowMs = Date.now(),
  secret = pepper(),
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
  const expected = await hmacSha256(secret, `early.${expiresAtMs}`)
  const received = fromBase64Url(signature)
  return received !== null && timingSafeEqualBytes(received, expected)
}
