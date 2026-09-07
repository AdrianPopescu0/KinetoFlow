import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
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

test("recunoaște eroarea Supabase de email neconfirmat", () => {
  assert.equal(isEmailNotConfirmedAuthError({ code: "email_not_confirmed" }), true)
  assert.equal(isEmailNotConfirmedAuthError({ message: "Email not confirmed" }), true)
  assert.equal(isEmailNotConfirmedAuthError({ message: "Invalid login credentials" }), false)
  assert.equal(isEmailNotConfirmedAuthError(null), false)
})
