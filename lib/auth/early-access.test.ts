import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
  EARLY_ACCESS_TTL_DAYS,
  EARLY_ACCESS_TTL_MS,
  EARLY_ACCESS_FALLBACK_PEPPER,
  hasValidEarlyAccessCookie,
  isValidEarlyAccessCode,
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

test("cookie-ul Early Access e valabil 90 de zile, nu 30", async () => {
  assert.equal(EARLY_ACCESS_TTL_DAYS, 90)
  assert.equal(EARLY_ACCESS_TTL_MS, 90 * 24 * 60 * 60 * 1000)

  const issuedAt = Date.UTC(2026, 0, 1)
  const token = await signEarlyAccessCookie(issuedAt + EARLY_ACCESS_TTL_MS, "pepper")
  assert.equal(await hasValidEarlyAccessCookie(token, issuedAt + 30 * 24 * 60 * 60 * 1000, "pepper"), true)
  assert.equal(await hasValidEarlyAccessCookie(token, issuedAt + EARLY_ACCESS_TTL_MS - 1000, "pepper"), true)
  assert.equal(await hasValidEarlyAccessCookie(token, issuedAt + EARLY_ACCESS_TTL_MS + 1000, "pepper"), false)
  assert.equal(await hasValidEarlyAccessCookie("nu", issuedAt, "pepper"), false)
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
