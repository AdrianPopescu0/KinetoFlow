import assert from "node:assert/strict"
import { test } from "node:test"

import {
  generateEmailOtpCode,
  hashEmailOtpCode,
  hashesMatch,
  isEmailOtpCode,
  normalizeAuthEmail,
  parseAuthEmailOtpPurpose,
  readVerifiedEmailCookie,
  signVerifiedEmailCookie,
} from "./email-otp.ts"
import { AUTH_OTP_FROM_DEFAULT, buildAuthOtpEmail } from "./email-otp-email.ts"
import { emailOtpPageHref } from "./paths.ts"

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

test("emailul OTP conține codul și nu are buton de autologin", () => {
  const built = buildAuthOtpEmail({
    code: "654321",
    purpose: "register",
    loginUrl: "http://127.0.0.1:43123/login?mode=signup",
  })
  assert.match(built.html, /654321/)
  assert.match(built.text, /Codul tău: 654321/)
  assert.match(built.subject, /crearea contului/)
  assert.equal(AUTH_OTP_FROM_DEFAULT, "KinetoFlow <no-reply@kinetoflow.ro>")
  assert.equal(built.html.includes("/auth/email-cod?token="), false)
  assert.equal(built.text.includes("/auth/email-cod?token="), false)
  assert.equal(built.html.includes("inline-block;background:#042f2e"), false)
})

test("OTP-ul de 6 cifre e doar pentru înregistrare, nu pentru Sign In", () => {
  assert.equal(parseAuthEmailOtpPurpose("register"), "register")
  assert.equal(parseAuthEmailOtpPurpose("login"), "login")
  assert.equal(parseAuthEmailOtpPurpose(undefined), "login")
})

test("ecranul de confirmare e o rută din aplicație, nu un link din email", () => {
  assert.equal(
    emailOtpPageHref("Admin@Clinica.RO", "register"),
    "/auth/email-cod?email=Admin%40Clinica.RO&purpose=register",
  )
  assert.equal(emailOtpPageHref("ana@clinica.ro").startsWith("/auth/email-cod?"), true)
  assert.equal(emailOtpPageHref("ana@clinica.ro").includes("purpose=register"), true)
  assert.equal(emailOtpPageHref("ana@clinica.ro").includes("token="), false)
})
