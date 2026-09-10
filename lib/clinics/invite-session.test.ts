import assert from "node:assert/strict"
import { test } from "node:test"

import {
  inviteTokenFromPathname,
  isInviteContinuePath,
  isInviteFinalizePath,
  THERAPIST_INVITE_CONTINUE_PATH,
  THERAPIST_INVITE_FINALIZE_PATH,
  therapistInviteFinalizeHref,
  therapistInvitePersistScript,
  therapistPostAuthHref,
} from "./invite-session.ts"

const token = "AbCdEfGhIjKlMnOpQrStUvWx"

test("tokenul din calea invitației ignoră /finalize și /continue", () => {
  assert.equal(inviteTokenFromPathname(`/auth/invitatie/${token}`), token)
  assert.equal(inviteTokenFromPathname(`/auth/invitatie/${token}/`), token)
  assert.equal(inviteTokenFromPathname("/auth/invitatie/finalize"), null)
  assert.equal(inviteTokenFromPathname("/auth/invitatie/finalize?invite=x"), null)
  assert.equal(inviteTokenFromPathname("/auth/invitatie/continue"), null)
  assert.equal(inviteTokenFromPathname("/login"), null)
  assert.equal(isInviteFinalizePath(THERAPIST_INVITE_FINALIZE_PATH), true)
  assert.equal(isInviteContinuePath(THERAPIST_INVITE_CONTINUE_PATH), true)
  assert.equal(isInviteFinalizePath(`/auth/invitatie/${token}`), false)
})

test("href-ul de finalizare păstrează tokenul în query", () => {
  assert.equal(therapistInviteFinalizeHref(token), `/auth/invitatie/finalize?invite=${token}`)
})

test("scriptul inline salvează imediat tokenul în localStorage", () => {
  const script = therapistInvitePersistScript(token)
  assert.match(script, /localStorage\.setItem/)
  assert.match(script, /kf_therapist_invite/)
  assert.match(script, new RegExp(token))
  assert.equal(therapistInvitePersistScript("scurt"), "")
})

test("după login, invitația în așteptare bate ecranul de clinică nouă", () => {
  assert.equal(therapistPostAuthHref("/onboarding", token), `/auth/invitatie/finalize?invite=${token}`)
  assert.equal(therapistPostAuthHref("/dashboard", token), `/auth/invitatie/finalize?invite=${token}`)
  assert.equal(therapistPostAuthHref("/onboarding", null), THERAPIST_INVITE_CONTINUE_PATH)
  assert.equal(therapistPostAuthHref("/dashboard", null), "/dashboard")
  assert.equal(therapistPostAuthHref(null, "nu"), "/dashboard")
})
