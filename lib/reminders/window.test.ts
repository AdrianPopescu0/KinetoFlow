import assert from "node:assert/strict"
import { test } from "node:test"

import { bucharestHour } from "../time/bucharest.ts"

const REMINDER_HOUR = 18

test("18:30 EEST (vară) = 15:30 UTC este în fereastra de reminder", () => {
  const now = new Date("2026-07-15T15:30:00.000Z")
  assert.equal(bucharestHour(now), REMINDER_HOUR)
})

test("19:30 EEST = 16:30 UTC nu trimite (slotul de iarnă e ignorat vara)", () => {
  const now = new Date("2026-07-15T16:30:00.000Z")
  assert.notEqual(bucharestHour(now), REMINDER_HOUR)
})

test("18:30 EET (iarnă) = 16:30 UTC este în fereastra de reminder", () => {
  const now = new Date("2026-01-15T16:30:00.000Z")
  assert.equal(bucharestHour(now), REMINDER_HOUR)
})

test("17:30 EET = 15:30 UTC nu trimite (slotul de vară e ignorat iarna)", () => {
  const now = new Date("2026-01-15T15:30:00.000Z")
  assert.notEqual(bucharestHour(now), REMINDER_HOUR)
})
