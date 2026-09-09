import assert from "node:assert/strict"
import { test } from "node:test"

import {
  generateEmailOtpCode,
  hashEmailOtpCode,
  hashesMatch,
  isEmailOtpCode,
  normalizeAuthEmail,
  readVerifiedEmailCookie,
  signVerifiedEmailCookie,
} from "./email-otp.ts"
import { AUTH_OTP_FROM_DEFAULT, buildAuthOtpEmail } from "./email-otp-email.ts"

test("normalizeAuthEmail acceptă doar adrese valide", () => {
  assert.equal(normalizeAuthEmail("  Admin@Clinica.RO "), "admin@clinica.ro")
  assert.equal(normalizeAuthEmail("nu-e-email"), null)
  assert.equal(normalizeAuthEmail(""), null)
})

test("generateEmailOtpCode produce 6 cifre", () => {
  const code = generateEmailOtpCode()
  assert.equal(isEmailOtpCode(code), true)
  assert.equal(code.length, 6)
})

test("hashEmailOtpCode e determinist și depinde de email", () => {
  const pepper = "test-pepper"
  const a = hashEmailOtpCode("a@b.ro", "123456", pepper)
  const b = hashEmailOtpCode("a@b.ro", "123456", pepper)
  const other = hashEmailOtpCode("c@d.ro", "123456", pepper)
  assert.equal(hashesMatch(a, b), true)
  assert.equal(hashesMatch(a, other), false)
})

test("cookie-ul de email verificat suportă puncte în adresă", () => {
  const pepper = "cookie-pepper"
  const email = "jane.doe@kinetoflow.ro"
  const token = signVerifiedEmailCookie(email, Date.now() + 60_000, pepper)
  assert.equal(readVerifiedEmailCookie(token, Date.now(), pepper), email)
  assert.equal(readVerifiedEmailCookie(token, Date.now() + 120_000, pepper), null)
})

test("emailul OTP conține codul și expeditorul implicit e no-reply", () => {
  const built = buildAuthOtpEmail({
    code: "654321",
    purpose: "login",
    loginUrl: "http://127.0.0.1:43123/login",
    magicUrl: "http://127.0.0.1:43123/auth/email-cod?token=abc",
  })
  assert.match(built.html, /654321/)
  assert.match(built.text, /654321/)
  assert.match(built.subject, /autentificare/)
  assert.equal(AUTH_OTP_FROM_DEFAULT, "KinetoFlow <no-reply@kinetoflow.ro>")
})
