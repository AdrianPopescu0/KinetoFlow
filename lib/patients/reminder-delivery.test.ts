import assert from "node:assert/strict"
import { test } from "node:test"

import { chooseReminderDelivery } from "./reminder-delivery.ts"

test("push are prioritate când există token FCM", () => {
  assert.equal(
    chooseReminderDelivery({
      pushTokens: ["fcm-token"],
      hasValidPhone: true,
      hasAccessCode: true,
    }),
    "push",
  )
  assert.equal(
    chooseReminderDelivery({
      pushTokens: ["fcm-token"],
      hasValidPhone: false,
      hasAccessCode: false,
    }),
    "push",
  )
})

test("fără token push, reminder-ul rămâne pe SMS dacă telefonul și codul sunt valide", () => {
  assert.equal(
    chooseReminderDelivery({
      pushTokens: [],
      hasValidPhone: true,
      hasAccessCode: true,
    }),
    "sms",
  )
})

test("fără token, telefon sau cod, nu se trimite nimic", () => {
  assert.equal(
    chooseReminderDelivery({
      pushTokens: [],
      hasValidPhone: false,
      hasAccessCode: true,
    }),
    "none",
  )
  assert.equal(
    chooseReminderDelivery({
      pushTokens: [],
      hasValidPhone: true,
      hasAccessCode: false,
    }),
    "none",
  )
})
