import assert from "node:assert/strict"
import { test } from "node:test"

import { clinicReadyFromUser, invitedTherapistFromUser } from "./clinic-ready.ts"

test("clinicReadyFromUser recunoaște cabinetul din clinic_name", () => {
  assert.equal(
    clinicReadyFromUser({
      user_metadata: { clinic_name: "Cabinet Demo" },
      app_metadata: {},
    }),
    true,
  )
  assert.equal(clinicReadyFromUser({ user_metadata: {}, app_metadata: {} }), false)
})

test("terapeutul invitat e recunoscut din rol, token sau invited_by", () => {
  assert.equal(
    invitedTherapistFromUser({ user_metadata: { role: "therapist" }, app_metadata: {} }),
    true,
  )
  assert.equal(
    invitedTherapistFromUser({ user_metadata: { invited: true }, app_metadata: {} }),
    true,
  )
  assert.equal(
    invitedTherapistFromUser({
      user_metadata: { invite_token: "AbCdEfGhIjKlMnOpQrStUvWx" },
      app_metadata: {},
    }),
    true,
  )
  assert.equal(
    invitedTherapistFromUser({ user_metadata: { invited_by: "owner-id" }, app_metadata: {} }),
    true,
  )
  assert.equal(invitedTherapistFromUser({ user_metadata: {}, app_metadata: { role: "admin" } }), false)
})

test("JWT-ul vechi fără clinic_name tot e clinic-ready dacă terapeutul invitat are clinic_id", () => {
  assert.equal(
    clinicReadyFromUser({
      user_metadata: { role: "therapist" },
      app_metadata: { clinic_id: "owner-id", role: "therapist" },
    }),
    true,
  )
  assert.equal(
    clinicReadyFromUser({
      user_metadata: { role: "therapist" },
      app_metadata: {},
    }),
    false,
  )
})
