import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_COOKIE_VALUE,
  EARLY_ACCESS_MAX_AGE_SECONDS,
  EARLY_ACCESS_TTL_DAYS,
  earlyAccessCookieOptions,
  isValidEarlyAccessCode,
  stampEarlyAccessCookie,
} from "./early-access.ts"

test("codul Early Access are 12 caractere și e verificat exact", () => {
  assert.equal(DEFAULT_EARLY_ACCESS_CODE.length, EARLY_ACCESS_CODE_LENGTH)
  assert.equal(isValidEarlyAccessCode(DEFAULT_EARLY_ACCESS_CODE, DEFAULT_EARLY_ACCESS_CODE), true)
  assert.equal(isValidEarlyAccessCode(" kineto-early ", DEFAULT_EARLY_ACCESS_CODE), false)
  assert.equal(isValidEarlyAccessCode("KINETO-EARL!", DEFAULT_EARLY_ACCESS_CODE), false)
  assert.equal(isValidEarlyAccessCode("scurt", DEFAULT_EARLY_ACCESS_CODE), false)
  assert.equal(isValidEarlyAccessCode(` ${DEFAULT_EARLY_ACCESS_CODE} `, DEFAULT_EARLY_ACCESS_CODE), true)
})

test("cookie-ul early_access_verified e un flag simplu, valabil 90 de zile", () => {
  assert.equal(EARLY_ACCESS_COOKIE, "early_access_verified")
  assert.equal(EARLY_ACCESS_COOKIE_VALUE, "1")
  assert.equal(EARLY_ACCESS_TTL_DAYS, 90)
  assert.equal(EARLY_ACCESS_MAX_AGE_SECONDS, 90 * 24 * 60 * 60)

  const options = earlyAccessCookieOptions("http")
  assert.equal(options.httpOnly, true)
  assert.equal(options.sameSite, "lax")
  assert.equal(options.path, "/")
  assert.equal(options.maxAge, EARLY_ACCESS_MAX_AGE_SECONDS)
  assert.equal(options.secure, false)

  const written: Array<{ name: string; value: string }> = []
  stampEarlyAccessCookie((name, value) => written.push({ name, value }), "http")
  assert.deepEqual(written, [{ name: EARLY_ACCESS_COOKIE, value: "1" }])
})
