import assert from "node:assert/strict"
import { test } from "node:test"

import { parsePendingEmailOtp } from "./pending-email-otp.ts"

const token = "AbCdEfGhIjKlMnOpQrStUvWx"

test("sesiunea OTP de invitație păstrează tokenul din URL", () => {
  const parsed = parsePendingEmailOtp(
    JSON.stringify({
      email: " ana@clinica.ro ",
      password: "Parola1!",
      purpose: "register",
      legalAccept: true,
      inviteToken: token,
      devCode: "123456",
    }),
  )
  assert.equal(parsed?.email, "ana@clinica.ro")
  assert.equal(parsed?.inviteToken, token)
  assert.equal(parsed?.purpose, "register")
  assert.equal(parsed?.devCode, "123456")
})

test("tokenul de invitație invalid nu e păstrat în sesiunea OTP", () => {
  const parsed = parsePendingEmailOtp(
    JSON.stringify({
      email: "ana@clinica.ro",
      password: "Parola1!",
      purpose: "register",
      inviteToken: "scurt",
    }),
  )
  assert.equal(parsed?.inviteToken, undefined)
})
