import assert from "node:assert/strict"
import { test } from "node:test"

import { therapistInviteMessage } from "./invite-message.ts"

test("therapistInviteMessage include numele, clinica, linkul și codul", () => {
  const message = therapistInviteMessage({
    therapistName: "Andrei Popescu",
    clinicName: "KinetoKlinik",
    inviteLink: "https://kinetoflow.ro/auth/activare?token_hash=abc",
    accessCode: "12345678",
  })

  assert.match(message, /Salut Andrei!/)
  assert.match(message, /KinetoKlinik/)
  assert.match(message, /https:\/\/kinetoflow\.ro\/auth\/activare\?token_hash=abc/)
  assert.match(message, /Codul tău de acces este 12345678/)
})
