import assert from "node:assert/strict"
import { test } from "node:test"

import {
  decideTherapistInviteAttach,
  googleAccountEmail,
  INVITE_EXPIRED_ERROR,
  INVITE_NO_EMAIL_ERROR,
  INVITE_OTHER_CLINIC_ERROR,
  pickTherapistInviteCandidate,
  readTherapistInviteToken,
  therapistInvitePagePath,
  therapistInviteReasonMessage,
  oauthInviteCallbackUrl,
} from "./invite-attach.ts"

const future = new Date(Date.now() + 60_000).toISOString()
const past = new Date(Date.now() - 60_000).toISOString()

test("googleAccountEmail preferă emailul din identitatea Google", () => {
  assert.equal(
    googleAccountEmail({
      email: "alias@clinica.ro",
      identities: [{ provider: "google", identity_data: { email: "Terapeut@Gmail.com" } }],
    }),
    "terapeut@gmail.com",
  )
  assert.equal(googleAccountEmail({ email: "  Ana@Clinica.RO " }), "ana@clinica.ro")
  assert.equal(googleAccountEmail({ email: "nu-e-email" }), null)
})

test("readTherapistInviteToken acceptă doar tokenuri valide, query înaintea cookie-ului", () => {
  const token = "AbCdEfGhIjKlMnOpQrStUvWx"
  assert.equal(readTherapistInviteToken(token, "aaaaaaaaaaaaaaaaaaaaaa"), token)
  assert.equal(readTherapistInviteToken(null, token), token)
  assert.equal(readTherapistInviteToken("scurt", "tot-scurt"), null)
})

test("pickTherapistInviteCandidate folosește emailul pending înainte de a concluziona că nu există clinică", () => {
  const pendingByEmail = {
    clinic_name: "KinetoCare",
    email: "ana@gmail.com",
    expires_at: future,
    accepted_at: null,
    accepted_user_id: null,
  }
  const picked = pickTherapistInviteCandidate({
    byToken: null,
    byEmail: pendingByEmail,
    byAcceptedUser: null,
  })
  assert.equal(picked, pendingByEmail)
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "google-user-1",
      invite: pendingByEmail,
      existingClinicName: null,
    }).action,
    "attach",
  )
  assert.equal(
    pickTherapistInviteCandidate({
      byToken: { token: "token-1", expires_at: future },
      byEmail: pendingByEmail,
      byAcceptedUser: null,
    })?.token,
    "token-1",
  )
  const expiredToken = {
    token: "token-expirat",
    expires_at: past,
    accepted_at: null,
    accepted_user_id: null,
  }
  const pickedOverExpired = pickTherapistInviteCandidate({
    byToken: expiredToken,
    byEmail: pendingByEmail,
    byAcceptedUser: null,
    userId: "google-user-1",
  })
  assert.equal(pickedOverExpired, pendingByEmail)
  assert.equal(
    pickTherapistInviteCandidate({
      byToken: expiredToken,
      byEmail: null,
      byAcceptedUser: null,
    }),
    expiredToken,
  )
})

test("decideTherapistInviteAttach cere email Google și o invitație deschisă", () => {
  assert.equal(
    decideTherapistInviteAttach({
      email: null,
      userId: "user-1",
      invite: { clinic_name: "KinetoCare", expires_at: future },
      existingClinicName: null,
    }).action,
    "no_email",
  )
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "user-1",
      invite: null,
      existingClinicName: null,
    }).error,
    INVITE_EXPIRED_ERROR,
  )
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "user-1",
      invite: { clinic_name: "KinetoCare", expires_at: past },
      existingClinicName: null,
    }).action,
    "expired",
  )
})

test("decideTherapistInviteAttach leagă terapeutul de clinica din invitație", () => {
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "user-1",
      invite: { clinic_name: "KinetoCare", expires_at: future },
      existingClinicName: null,
    }).action,
    "attach",
  )
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "user-1",
      invite: { clinic_name: "KinetoCare", expires_at: future },
      existingClinicName: "KinetoCare",
    }).action,
    "already_member",
  )
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "user-1",
      invite: {
        clinic_name: "KinetoCare",
        expires_at: past,
        accepted_at: past,
        accepted_user_id: "user-1",
      },
      existingClinicName: "KinetoCare",
    }).action,
    "already_member",
  )
  assert.equal(
    decideTherapistInviteAttach({
      email: "ana@gmail.com",
      userId: "user-1",
      invite: { clinic_name: "KinetoCare", expires_at: future },
      existingClinicName: "Altă Clinică",
    }).error,
    INVITE_OTHER_CLINIC_ERROR,
  )
})

test("mesajele de pe pagina de invitație acoperă eșecul Google", () => {
  assert.equal(therapistInvitePagePath("AbCdEfGhIjKlMnOpQrStUvWx", "oauth"), "/auth/invitatie/AbCdEfGhIjKlMnOpQrStUvWx?reason=oauth")
  assert.equal(
    oauthInviteCallbackUrl("https://kinetoflow.ro/", "AbCdEfGhIjKlMnOpQrStUvWx"),
    "https://kinetoflow.ro/auth/callback?invite=AbCdEfGhIjKlMnOpQrStUvWx&next=%2Fdashboard",
  )
  assert.match(therapistInviteReasonMessage("oauth") ?? "", /Google/)
  assert.equal(therapistInviteReasonMessage("no_email"), INVITE_NO_EMAIL_ERROR)
})
