import assert from "node:assert/strict"
import { test } from "node:test"

import { notifyChannelLabel, parseNotifyChannel } from "./notify-channel.ts"

test("acceptă doar whatsapp și sms", () => {
  assert.equal(parseNotifyChannel("whatsapp"), "whatsapp")
  assert.equal(parseNotifyChannel("sms"), "sms")
  assert.equal(parseNotifyChannel("email"), null)
  assert.equal(parseNotifyChannel(null), null)
  assert.equal(parseNotifyChannel(""), null)
})

test("etichetele sunt în română", () => {
  assert.equal(notifyChannelLabel("whatsapp"), "WhatsApp")
  assert.equal(notifyChannelLabel("sms"), "SMS")
  assert.equal(notifyChannelLabel(null), "Nesetat")
})
