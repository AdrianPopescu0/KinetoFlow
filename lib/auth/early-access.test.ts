import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_COOKIE_VALUE,
  EARLY_ACCESS_MAX_AGE_SECONDS,
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

test("cookie-ul Early Access e un flag simplu pe 90 de zile", () => {
  assert.equal(EARLY_ACCESS_COOKIE, "early_access_verified")
  assert.equal(EARLY_ACCESS_COOKIE_VALUE, "1")
  assert.equal(EARLY_ACCESS_MAX_AGE_SECONDS, 90 * 24 * 60 * 60)
  const written: Array<{ name: string; value: string; maxAge: number; path: string }> = []
  stampEarlyAccessCookie((name, value, options) => {
    written.push({ name, value, maxAge: options.maxAge, path: options.path })
  })
  assert.deepEqual(written, [
    {
      name: "early_access_verified",
      value: "1",
      maxAge: EARLY_ACCESS_MAX_AGE_SECONDS,
      path: "/",
    },
  ])
})
