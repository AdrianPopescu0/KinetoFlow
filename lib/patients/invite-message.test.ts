import assert from "node:assert/strict"
import { test } from "node:test"

import { patientInviteShareMessage } from "./invite-message.ts"
import { patientSmsHref } from "./phone.ts"
import { patientWhatsAppHref, patientWhatsAppMeHref, patientWhatsAppWebHref } from "./whatsapp-links.ts"

const SAMPLE = patientInviteShareMessage({
  fullName: "Ana Popescu",
  accessCode: "12345678",
  accessUrl: "https://kinetoflow.ro/acces",
})

test("mesajul de invitație are numele, linkul /acces și codul de 8 cifre", () => {
  assert.equal(
    SAMPLE,
    [
      "Bună, Ana Popescu! Sunt kinetoterapeutul tău de la KinetoFlow. Ți-am pregătit planul tău personalizat de exerciții.",
      "Accesează aplicația aici: https://kinetoflow.ro/acces",
      "",
      "Codul tău unic de 8 cifre: 12345678",
      "",
      "Introdu numărul tău de telefon și codul de mai sus pentru a intra în program.",
      "Te rog să faci check-in-ul de durere înainte să începi exercițiile. Spor la recuperare!",
    ].join("\n"),
  )
})

test("WhatsApp și SMS la pacient nou deschid numărul cu mesajul precompletat", () => {
  const wa = patientWhatsAppHref("0722 123 456", SAMPLE)
  assert.ok(wa)
  const waUrl = new URL(wa)
  assert.equal(waUrl.hostname, "wa.me")
  assert.equal(waUrl.pathname, "/40722123456")
  assert.equal(waUrl.searchParams.get("text"), SAMPLE)

  const sms = patientSmsHref("0722 123 456", SAMPLE)
  assert.equal(sms, `sms:+40722123456?body=${encodeURIComponent(SAMPLE)}`)
})

test("pe fișă, WhatsApp și SMS deschid doar numărul, fără text", () => {
  assert.equal(patientWhatsAppMeHref("0722 123 456"), "https://wa.me/40722123456")
  assert.equal(patientWhatsAppWebHref("0722 123 456"), "https://web.whatsapp.com/send?phone=40722123456")
  assert.equal(patientSmsHref("0722 123 456"), "sms:+40722123456")
})
