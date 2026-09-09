import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_EARLY_ACCESS_CODE,
  EARLY_ACCESS_CODE_LENGTH,
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

test("cookie-ul Early Access expiră", async () => {
  const token = await signEarlyAccessCookie(Date.now() + 60_000, "pepper")
  assert.equal(await hasValidEarlyAccessCookie(token, Date.now(), "pepper"), true)
  assert.equal(await hasValidEarlyAccessCookie(token, Date.now() + 120_000, "pepper"), false)
  assert.equal(await hasValidEarlyAccessCookie("nu", Date.now(), "pepper"), false)
})
