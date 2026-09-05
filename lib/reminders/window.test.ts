import assert from "node:assert/strict"
import { test } from "node:test"

import { bucharestHour } from "../time/bucharest.ts"

const REMINDER_HOUR = 18

test("18:00 EEST (vară) = 15:00 UTC este în fereastra de reminder", () => {
  const now = new Date("2026-07-15T15:00:00.000Z")
  assert.equal(bucharestHour(now), REMINDER_HOUR)
})

test("19:00 EEST = 16:00 UTC nu trimite (slotul de iarnă e ignorat vara)", () => {
  const now = new Date("2026-07-15T16:00:00.000Z")
  assert.notEqual(bucharestHour(now), REMINDER_HOUR)
})

test("18:00 EET (iarnă) = 16:00 UTC este în fereastra de reminder", () => {
  const now = new Date("2026-01-15T16:00:00.000Z")
  assert.equal(bucharestHour(now), REMINDER_HOUR)
})

test("17:00 EET = 15:00 UTC nu trimite (slotul de vară e ignorat iarna)", () => {
  const now = new Date("2026-01-15T15:00:00.000Z")
  assert.notEqual(bucharestHour(now), REMINDER_HOUR)
})
