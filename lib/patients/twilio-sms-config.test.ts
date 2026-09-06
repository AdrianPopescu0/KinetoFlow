import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isTwilioSmsConfigured,
  resolveTwilioSmsFrom,
  twilioSmsProviderFlags,
} from "./twilio-sms-config.ts"

const credentials = {
  TWILIO_ACCOUNT_SID: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  TWILIO_AUTH_TOKEN: "token-secret",
}

test("TWILIO_PHONE_NUMBER activează Twilio SMS", () => {
  const env = { ...credentials, TWILIO_PHONE_NUMBER: "+4915888623971" }
  assert.equal(resolveTwilioSmsFrom(env), "+4915888623971")
  assert.equal(isTwilioSmsConfigured(env), true)
  assert.deepEqual(twilioSmsProviderFlags(env), {
    twilioWhatsApp: false,
    metaWhatsApp: false,
    twilioSms: true,
  })
})

test("acceptă numărul configurat fără plus și cu prefix whatsapp:", () => {
  assert.equal(resolveTwilioSmsFrom({ TWILIO_PHONE_NUMBER: "4915888623971" }), "+4915888623971")
  assert.equal(
    resolveTwilioSmsFrom({ TWILIO_PHONE_NUMBER: "whatsapp:+4915888623971" }),
    "+4915888623971",
  )
})

test("folosește alias-urile vechi dacă TWILIO_PHONE_NUMBER lipsește", () => {
  assert.equal(resolveTwilioSmsFrom({ TWILIO_SMS_FROM: "+4915888623971" }), "+4915888623971")
  assert.equal(resolveTwilioSmsFrom({ TWILIO_FROM: "+4915888623971" }), "+4915888623971")
  assert.equal(
    resolveTwilioSmsFrom({ TWILIO_WHATSAPP_FROM: "whatsapp:+4915888623971" }),
    "+4915888623971",
  )
})

test("TWILIO_PHONE_NUMBER are prioritate față de alias-uri", () => {
  assert.equal(
    resolveTwilioSmsFrom({
      TWILIO_PHONE_NUMBER: "+4915888623971",
      TWILIO_SMS_FROM: "+14155552671",
      TWILIO_FROM: "+14155550000",
    }),
    "+4915888623971",
  )
})

test("fără număr From, twilioSms rămâne false", () => {
  assert.equal(isTwilioSmsConfigured(credentials), false)
  assert.equal(twilioSmsProviderFlags(credentials).twilioSms, false)
  assert.equal(isTwilioSmsConfigured({ TWILIO_PHONE_NUMBER: "+4915888623971" }), false)
  assert.equal(resolveTwilioSmsFrom({}), null)
})
