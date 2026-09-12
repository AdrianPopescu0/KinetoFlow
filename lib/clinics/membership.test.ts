import assert from "node:assert/strict"
import { test } from "node:test"

import { postGoogleAuthDestination } from "./google-auth-path.ts"

test("după Google, emailul cu clinică existentă merge în dashboard", () => {
  assert.equal(postGoogleAuthDestination({ attached: false, clinicReady: true }), "/dashboard")
  assert.equal(postGoogleAuthDestination({ attached: true, clinicReady: false }), "/dashboard")
})

test("invitația pending se finalizează, utilizatorul nou creează clinica", () => {
  assert.equal(
    postGoogleAuthDestination({
      attached: false,
      clinicReady: false,
      inviteToken: "AbCdEfGhIjKlMnOpQrStUvWx",
    }),
    "/auth/invitatie/finalize?invite=AbCdEfGhIjKlMnOpQrStUvWx",
  )
  assert.equal(postGoogleAuthDestination({ attached: false, clinicReady: false }), "/onboarding")
  assert.equal(postGoogleAuthDestination({ attached: false, clinicReady: false, inviteToken: null }), "/onboarding")
})
