import assert from "node:assert/strict"
import { test } from "node:test"

import { INVITE_LEGAL_ACCEPT_ERROR, inviteAcceptGoesToDashboard, isExistingAuthUserError, parseInviteActivation } from "./accept-invite.ts"

function inviteForm(input: { password?: string; email?: string; legal?: boolean }) {
  const formData = new FormData()
  if (input.password !== undefined) {
    formData.set("password", input.password)
  }
  if (input.email !== undefined) {
    formData.set("email", input.email)
  }
  if (input.legal) {
    formData.set("legal_accept", "on")
  }
  return formData
}

test("parseInviteActivation cere parolă validă și acord legal, ignoră emailul din formular", () => {
  const parsed = parseInviteActivation(
    inviteForm({ password: "Parola1!", email: "intrus@example.com", legal: true }),
  )
  assert.equal("password" in parsed && parsed.password === "Parola1!", true)
  assert.equal("email" in parsed, false)

  assert.equal("error" in parseInviteActivation(inviteForm({ password: "Parola1!", legal: false })), true)
  const noLegal = parseInviteActivation(inviteForm({ password: "Parola1!" }))
  assert.equal("error" in noLegal && noLegal.error, INVITE_LEGAL_ACCEPT_ERROR)

  const weak = parseInviteActivation(inviteForm({ password: "scurt", legal: true }))
  assert.equal("error" in weak, true)
})

test("după activare, destinația e doar /dashboard, niciodată onboarding", () => {
  assert.equal(inviteAcceptGoesToDashboard({ next: "/dashboard" }), true)
  assert.equal(inviteAcceptGoesToDashboard({ next: "/onboarding" }), false)
  assert.equal(inviteAcceptGoesToDashboard({ next: "/dashboard", error: "Eșec" }), false)
  assert.equal(inviteAcceptGoesToDashboard({ error: "Cod invalid" }), false)
  assert.equal(inviteAcceptGoesToDashboard(null), false)
})

test("emailul deja prezent în Auth nu e tratat ca eșec de signup", () => {
  assert.equal(isExistingAuthUserError({ code: "email_exists" }), true)
  assert.equal(isExistingAuthUserError({ code: "user_already_exists" }), true)
  assert.equal(isExistingAuthUserError({ message: "A user with this email address has already been registered" }), true)
  assert.equal(isExistingAuthUserError({ status: 422, message: "User already registered" }), true)
  assert.equal(isExistingAuthUserError({ message: "Invalid login credentials" }), false)
})
