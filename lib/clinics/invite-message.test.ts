import assert from "node:assert/strict"
import { test } from "node:test"

import { therapistInviteMessage } from "./invite-message.ts"

test("therapistInviteMessage include numele, clinica și linkul unic", () => {
  const message = therapistInviteMessage({
    therapistName: "Andrei Popescu",
    clinicName: "KinetoKlinik",
    inviteLink: "https://kinetoflow.ro/auth/invitatie/AbCdEfGhIjKlMnOpQrStUvWx",
  })

  assert.match(message, /Salut Andrei!/)
  assert.match(message, /KinetoKlinik/)
  assert.match(message, /https:\/\/kinetoflow\.ro\/auth\/invitatie\/AbCdEfGhIjKlMnOpQrStUvWx/)
  assert.match(message, /parolă/)
  assert.doesNotMatch(message, /cod/i)
  assert.doesNotMatch(message, /Codul tău de acces/)
})
