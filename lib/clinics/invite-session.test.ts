import assert from "node:assert/strict"
import { test } from "node:test"

import {
  afterGoogleOAuthPath,
  inviteTokenFromAuthUser,
  inviteTokenFromFormData,
  inviteTokenFromHref,
  inviteTokenFromPathname,
  isInviteContinuePath,
  isInviteFinalizePath,
  readTherapistInviteToken,
  THERAPIST_INVITE_CONTINUE_PATH,
  THERAPIST_INVITE_FINALIZE_PATH,
  therapistInviteContinueRecoverScript,
  therapistInviteFinalizeHref,
  therapistInvitePersistScript,
  therapistPostAuthHref,
} from "./invite-session.ts"

const token = "AbCdEfGhIjKlMnOpQrStUvWx"

test("tokenul din URL-ul paginii de invitație se citește din cale, query sau Referer", () => {
  assert.equal(inviteTokenFromHref(`/auth/invitatie/${token}`), token)
  assert.equal(inviteTokenFromHref(`https://kinetoflow.ro/auth/invitatie/${token}`), token)
  assert.equal(inviteTokenFromHref(`https://kinetoflow.ro/auth/invitatie/${token}?reason=oauth`), token)
  assert.equal(inviteTokenFromHref(`/auth/invitatie/finalize?invite=${token}`), token)
  assert.equal(inviteTokenFromHref("https://kinetoflow.ro/login"), null)
  assert.equal(inviteTokenFromHref(""), null)
})

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

test("scriptul inline salvează imediat tokenul în localStorage și cookie-ul citibil", () => {
  const script = therapistInvitePersistScript(token)
  assert.match(script, /localStorage\.setItem/)
  assert.match(script, /sessionStorage\.setItem/)
  assert.match(script, /document\.cookie/)
  assert.match(script, /kf_therapist_invite/)
  assert.match(script, /kf_invite/)
  assert.match(script, new RegExp(token))
  assert.equal(therapistInvitePersistScript("scurt"), "")
  const recover = therapistInviteContinueRecoverScript()
  assert.match(recover, /localStorage\.getItem/)
  assert.match(recover, /sessionStorage\.getItem/)
  assert.match(recover, /\/auth\/invitatie\/finalize/)
})

test("după login, invitația în așteptare bate ecranul de clinică nouă", () => {
  assert.equal(therapistPostAuthHref("/onboarding", token), `/auth/invitatie/finalize?invite=${token}`)
  assert.equal(therapistPostAuthHref("/dashboard", token), `/auth/invitatie/finalize?invite=${token}`)
  assert.equal(therapistPostAuthHref("/onboarding", null), THERAPIST_INVITE_CONTINUE_PATH)
  assert.equal(therapistPostAuthHref("/dashboard", null), "/dashboard")
  assert.equal(therapistPostAuthHref(null, "nu"), "/dashboard")
})

test("după Google OAuth nu se deschide formularul de clinică nouă", () => {
  assert.equal(afterGoogleOAuthPath({ attached: true, clinicReady: false, inviteToken: token }), "/dashboard")
  assert.equal(afterGoogleOAuthPath({ attached: false, clinicReady: true }), "/dashboard")
  assert.equal(
    afterGoogleOAuthPath({ attached: false, clinicReady: false, inviteToken: token }),
    `/auth/invitatie/finalize?invite=${token}`,
  )
  assert.equal(
    afterGoogleOAuthPath({ attached: false, clinicReady: false, inviteToken: null }),
    THERAPIST_INVITE_CONTINUE_PATH,
  )
  assert.notEqual(afterGoogleOAuthPath({ attached: false, clinicReady: false }), "/onboarding")
})

test("tokenul se citește din query, cookie httpOnly, cookie client sau metadate", () => {
  assert.equal(readTherapistInviteToken(null, "scurt", token), token)
  assert.equal(readTherapistInviteToken(token, "altceva"), token)
  assert.equal(
    inviteTokenFromAuthUser({
      user_metadata: { invite_token: token, invited: true },
      app_metadata: {},
    }),
    token,
  )
  assert.equal(inviteTokenFromAuthUser({ user_metadata: {}, app_metadata: {} }), null)
})

test("tokenul din formularul de înregistrare e citit din câmpul hidden", () => {
  const formData = new FormData()
  formData.set("invite_token", token)
  formData.set("email", "ana@clinica.ro")
  assert.equal(inviteTokenFromFormData(formData), token)

  const empty = new FormData()
  empty.set("email", "ana@clinica.ro")
  assert.equal(inviteTokenFromFormData(empty), null)
})

