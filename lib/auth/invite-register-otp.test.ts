import assert from "node:assert/strict"
import { test } from "node:test"

import { inviteOtpConfirmAllowsClinic, inviteOtpSendOutcome } from "./invite-register-otp.ts"

test("trimiterea OTP nu deschide clinica nici dacă serverul trimite next=/dashboard", () => {
  const outcome = inviteOtpSendOutcome({ next: "/dashboard", otpSent: true })
  assert.equal(outcome.enterClinic, false)
  assert.equal(outcome.showCodeStep, true)
  assert.equal(outcome.sent, true)
})

test("dacă trimiterea eșuează, afișăm ecranul de retrimitere, nu dashboard-ul", () => {
  const outcome = inviteOtpSendOutcome({
    error: "Nu am putut trimite emailul: timeout",
    canResend: true,
    next: "/dashboard",
  })
  assert.equal(outcome.enterClinic, false)
  assert.equal(outcome.showCodeStep, true)
  assert.equal(outcome.sent, false)
  assert.match(outcome.message ?? "", /trimite/)
})

test("un email deja confirmat rămâne pe formularul de înregistrare", () => {
  const outcome = inviteOtpSendOutcome({
    error: "Există deja un cont cu acest email.",
    canResend: false,
  })
  assert.equal(outcome.enterClinic, false)
  assert.equal(outcome.showCodeStep, false)
  assert.equal(outcome.sent, false)
})

test("intrarea în clinică e permisă doar după confirmarea OTP", () => {
  assert.equal(inviteOtpConfirmAllowsClinic({ next: "/dashboard" }), true)
  assert.equal(inviteOtpConfirmAllowsClinic({ next: "/dashboard", error: "Cod invalid" }), false)
  assert.equal(inviteOtpConfirmAllowsClinic({ otpSent: true } as { next?: string }), false)
  assert.equal(inviteOtpConfirmAllowsClinic(null), false)
})
