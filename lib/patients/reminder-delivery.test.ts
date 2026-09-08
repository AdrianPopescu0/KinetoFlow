import assert from "node:assert/strict"
import { test } from "node:test"

import { chooseReminderDelivery } from "./reminder-delivery.ts"

test("push când există token FCM", () => {
  assert.equal(chooseReminderDelivery({ pushTokens: ["fcm-token"] }), "push")
})

test("fără token push, nu se trimite SMS sau WhatsApp", () => {
  assert.equal(chooseReminderDelivery({ pushTokens: [] }), "none")
})
