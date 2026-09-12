import assert from "node:assert/strict"
import { test } from "node:test"

import { patientSmsHref, toTwilioE164 } from "./phone.ts"

test("SMS de contact e sms:+număr, fără body și fără cod de acces", () => {
  assert.equal(patientSmsHref("0722 123 456"), "sms:+40722123456")
  assert.equal(patientSmsHref("0722 123 456", ""), "sms:+40722123456")
  assert.equal(patientSmsHref("0722 123 456", "   "), "sms:+40722123456")
  assert.equal(patientSmsHref("12"), null)
})

test("SMS cu text păstrează body-ul", () => {
  assert.equal(patientSmsHref("0722123456", "Bună!"), `sms:+40722123456?body=${encodeURIComponent("Bună!")}`)
})

test("toTwilioE164 scoate prefixul whatsapp: și păstrează E.164", () => {
  assert.equal(toTwilioE164("whatsapp:+4915888623971"), "+4915888623971")
  assert.equal(toTwilioE164("whatsapp:+1 415 555 2671"), "+14155552671")
  assert.equal(toTwilioE164("+4915888623971"), "+4915888623971")
  assert.equal(toTwilioE164("4915888623971"), "+4915888623971")
  assert.equal(toTwilioE164(null), null)
})
