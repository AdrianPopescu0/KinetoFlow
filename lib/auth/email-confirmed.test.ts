import assert from "node:assert/strict"
import { test } from "node:test"

import {
  EMAIL_CONFIRM_REQUIRED,
  isEmailAlreadyRegisteredError,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
  isInvalidLoginCredentialsError,
  shouldConfirmEmailAndRetrySignIn,
} from "./email-confirmed.ts"

test("email_confirmed_at acordă acces complet", () => {
  assert.equal(isEmailConfirmedUser({ email_confirmed_at: "2026-09-07T10:00:00.000Z" }), true)
  assert.equal(isEmailConfirmedUser({ email_confirmed_at: null, identities: [{ provider: "email" }] }), false)
  assert.equal(isEmailConfirmedUser(null), false)
})

test("identitatea Google e considerată confirmată chiar fără email_confirmed_at", () => {
  assert.equal(
    isEmailConfirmedUser({
      email_confirmed_at: null,
      identities: [{ provider: "google" }],
    }),
    true,
  )
})

test("login-ul fără confirmare trimite utilizatorul înapoi la înregistrare, nu la un nou OTP de Sign In", () => {
  assert.match(EMAIL_CONFIRM_REQUIRED, /Înregistrează clinică nouă/)
  assert.equal(EMAIL_CONFIRM_REQUIRED.includes("Intră în cont"), false)
})

test("recunoaște eroarea Supabase de email neconfirmat", () => {
  assert.equal(isEmailNotConfirmedAuthError({ code: "email_not_confirmed" }), true)
  assert.equal(isEmailNotConfirmedAuthError({ message: "Email not confirmed" }), true)
  assert.equal(isEmailNotConfirmedAuthError({ message: "Invalid login credentials" }), false)
  assert.equal(isEmailNotConfirmedAuthError(null), false)
})

test("recunoaște credențialele invalide fără a le confunda cu email neconfirmat", () => {
  assert.equal(isInvalidLoginCredentialsError({ message: "Invalid login credentials" }), true)
  assert.equal(isInvalidLoginCredentialsError({ code: "invalid_credentials" }), true)
  assert.equal(isInvalidLoginCredentialsError({ message: "Email not confirmed" }), false)
  assert.equal(isInvalidLoginCredentialsError(null), false)
})

test("după OTP, retragem confirmarea și pentru Invalid login credentials", () => {
  assert.equal(
    shouldConfirmEmailAndRetrySignIn({
      error: { message: "Invalid login credentials" },
      emailJustVerified: true,
    }),
    true,
  )
  assert.equal(
    shouldConfirmEmailAndRetrySignIn({
      error: { message: "Invalid login credentials" },
      emailJustVerified: false,
    }),
    false,
  )
  assert.equal(
    shouldConfirmEmailAndRetrySignIn({
      error: { code: "email_not_confirmed" },
      emailJustVerified: false,
    }),
    true,
  )
})

test("recunoaște email deja înregistrat la signUp", () => {
  assert.equal(isEmailAlreadyRegisteredError({ code: "user_already_exists" }), true)
  assert.equal(isEmailAlreadyRegisteredError({ message: "User already registered" }), true)
  assert.equal(isEmailAlreadyRegisteredError({ message: "Invalid login credentials" }), false)
})
