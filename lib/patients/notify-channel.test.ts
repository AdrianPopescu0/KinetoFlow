import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_NOTIFY_CHANNEL,
  notifyChannelLabel,
  parseNotifyChannel,
  resolveNotifyChannel,
} from "./notify-channel.ts"

test("parsează valorile stocate", () => {
  assert.equal(parseNotifyChannel("whatsapp"), "whatsapp")
  assert.equal(parseNotifyChannel("sms"), "sms")
  assert.equal(parseNotifyChannel("email"), null)
  assert.equal(parseNotifyChannel(null), null)
})

test("trimiterea efectivă e mereu SMS", () => {
  assert.equal(DEFAULT_NOTIFY_CHANNEL, "sms")
  assert.equal(resolveNotifyChannel("whatsapp"), "sms")
  assert.equal(resolveNotifyChannel("sms"), "sms")
  assert.equal(resolveNotifyChannel(null), "sms")
  assert.equal(resolveNotifyChannel(undefined), "sms")
})

test("etichetele arată SMS după migrare", () => {
  assert.equal(notifyChannelLabel("whatsapp"), "SMS")
  assert.equal(notifyChannelLabel("sms"), "SMS")
  assert.equal(notifyChannelLabel(null), "Nesetat")
})
