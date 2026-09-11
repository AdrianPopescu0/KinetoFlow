import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_MAX_AGE_SECONDS,
  EARLY_ACCESS_TTL_DAYS,
  EARLY_ACCESS_TTL_MS,
  EARLY_ACCESS_FALLBACK_PEPPER,
  LEGACY_EARLY_ACCESS_COOKIE,
  earlyAccessCookieOptions,
  earlyAccessCookieSecure,
  earlyAccessCookieValueFrom,
  hasValidEarlyAccessCookie,
  isValidEarlyAccessCode,
  requestHasValidEarlyAccessCookie,
  signEarlyAccessCookie,
} from "./early-access.ts"

test("codul Early Access are 12 caractere și e verificat exact", () => {
  assert.equal(DEFAULT_EARLY_ACCESS_CODE.length, EARLY_ACCESS_CODE_LENGTH)
  assert.equal(isValidEarlyAccessCode(DEFAULT_EARLY_ACCESS_CODE, DEFAULT_EARLY_ACCESS_CODE), true)
  assert.equal(isValidEarlyAccessCode(" kineto-early ", DEFAULT_EARLY_ACCESS_CODE), false)
  assert.equal(isValidEarlyAccessCode("KINETO-EARL!", DEFAULT_EARLY_ACCESS_CODE), false)
  assert.equal(isValidEarlyAccessCode("scurt", DEFAULT_EARLY_ACCESS_CODE), false)
  assert.equal(isValidEarlyAccessCode(` ${DEFAULT_EARLY_ACCESS_CODE} `, DEFAULT_EARLY_ACCESS_CODE), true)
})

test("cookie-ul HTTP-only early_access_verified e valabil 90 de zile", async () => {
  assert.equal(EARLY_ACCESS_COOKIE, "early_access_verified")
  assert.equal(LEGACY_EARLY_ACCESS_COOKIE, "kf_early_access")
  assert.equal(EARLY_ACCESS_TTL_DAYS, 90)
  assert.equal(EARLY_ACCESS_MAX_AGE_SECONDS, 90 * 24 * 60 * 60)
  assert.equal(EARLY_ACCESS_TTL_MS, EARLY_ACCESS_MAX_AGE_SECONDS * 1000)

  const options = earlyAccessCookieOptions(Date.UTC(2026, 3, 1), false)
  assert.equal(options.httpOnly, true)
  assert.equal(options.sameSite, "lax")
  assert.equal(options.path, "/")
  assert.equal(options.maxAge, EARLY_ACCESS_MAX_AGE_SECONDS)
  assert.equal(options.secure, false)
  assert.equal(earlyAccessCookieSecure("https"), true)
  assert.equal(earlyAccessCookieSecure("http"), false)

  const issuedAt = Date.UTC(2026, 0, 1)
  const token = await signEarlyAccessCookie(issuedAt + EARLY_ACCESS_TTL_MS, EARLY_ACCESS_FALLBACK_PEPPER)
  assert.equal(
    await hasValidEarlyAccessCookie(token, issuedAt + 30 * 24 * 60 * 60 * 1000, EARLY_ACCESS_FALLBACK_PEPPER),
    true,
  )
  assert.equal(await hasValidEarlyAccessCookie(token, issuedAt + EARLY_ACCESS_TTL_MS - 1000, EARLY_ACCESS_FALLBACK_PEPPER), true)
  assert.equal(await hasValidEarlyAccessCookie(token, issuedAt + EARLY_ACCESS_TTL_MS + 1000, EARLY_ACCESS_FALLBACK_PEPPER), false)
  assert.equal(await hasValidEarlyAccessCookie("nu", issuedAt, EARLY_ACCESS_FALLBACK_PEPPER), false)
})

test("middleware citește early_access_verified înaintea cookie-ului vechi", async () => {
  const token = await signEarlyAccessCookie(Date.now() + 60_000)
  const cookies = new Map<string, string>([[EARLY_ACCESS_COOKIE, token]])
  assert.equal(earlyAccessCookieValueFrom((name) => {
    const value = cookies.get(name)
    return value ? { value } : undefined
  }), token)
  assert.equal(
    await requestHasValidEarlyAccessCookie({
      cookies: {
        get: (name: string) => {
          const value = cookies.get(name)
          return value ? { value } : undefined
        },
      },
    }),
    true,
  )

  const legacyOnly = new Map<string, string>([[LEGACY_EARLY_ACCESS_COOKIE, token]])
  assert.equal(
    await requestHasValidEarlyAccessCookie({
      cookies: {
        get: (name: string) => {
          const value = legacyOnly.get(name)
          return value ? { value } : undefined
        },
      },
    }),
    true,
  )
})

test("cookie-ul semnat pe Node e valid și cu pepper-ul Edge", async () => {
  const expiresAt = Date.now() + 60_000
  const token = await signEarlyAccessCookie(expiresAt, "service-role-old")
  assert.equal(
    await hasValidEarlyAccessCookie(token, Date.now(), [EARLY_ACCESS_FALLBACK_PEPPER, "service-role-old"]),
    true,
  )
  assert.equal(await hasValidEarlyAccessCookie(token, Date.now(), EARLY_ACCESS_FALLBACK_PEPPER), false)
})
