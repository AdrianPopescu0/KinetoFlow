import assert from "node:assert/strict"
import { test } from "node:test"

import {
  generateTherapistInviteToken,
  isTherapistInviteOpen,
  isTherapistInviteToken,
  therapistInviteUrl,
} from "./therapist-invite.ts"

test("tokenul de invitație e unic și suficient de lung", () => {
  const first = generateTherapistInviteToken()
  const second = generateTherapistInviteToken()
  assert.equal(isTherapistInviteToken(first), true)
  assert.notEqual(first, second)
  assert.equal(isTherapistInviteToken("scurt"), false)
})

test("URL-ul de invitație e pe domeniul aplicației", () => {
  assert.equal(
    therapistInviteUrl("https://kinetoflow.ro/", "AbCdEfGhIjKlMnOpQrStUvWx"),
    "https://kinetoflow.ro/auth/invitatie/AbCdEfGhIjKlMnOpQrStUvWx",
  )
})

test("invitația expirată sau acceptată nu mai e deschisă", () => {
  const future = new Date(Date.now() + 60_000).toISOString()
  const past = new Date(Date.now() - 60_000).toISOString()
  assert.equal(isTherapistInviteOpen({ expires_at: future }), true)
  assert.equal(isTherapistInviteOpen({ expires_at: future, accepted_at: future }), false)
  assert.equal(isTherapistInviteOpen({ expires_at: past }), false)
})
