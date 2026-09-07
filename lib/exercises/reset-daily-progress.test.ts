import assert from "node:assert/strict"
import { test } from "node:test"

import { bucharestDayPair } from "../time/bucharest.ts"

test("la 22:00 UTC iarna, reset-ul e pe 00:00 calendaristic București", () => {
  const keys = bucharestDayPair(new Date("2026-01-15T22:00:00.000Z"))
  assert.equal(keys.dateKey, "2026-01-16")
  assert.equal(keys.previousDateKey, "2026-01-15")
})

test("la 22:00 UTC vara, data București e deja ziua nouă", () => {
  const keys = bucharestDayPair(new Date("2026-07-15T22:00:00.000Z"))
  assert.equal(keys.dateKey, "2026-07-16")
  assert.equal(keys.previousDateKey, "2026-07-15")
})
