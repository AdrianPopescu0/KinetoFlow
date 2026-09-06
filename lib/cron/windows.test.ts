import assert from "node:assert/strict"
import { test } from "node:test"

import { bucharestHour } from "../time/bucharest.ts"

function isMidnightProgramWindow(now: Date): boolean {
  const hour = bucharestHour(now)
  return hour === 0 || hour === 1
}

test("22:00 UTC iarna = 00:00 EET, fereastră de program", () => {
  const now = new Date("2026-01-15T22:00:00.000Z")
  assert.equal(bucharestHour(now), 0)
  assert.equal(isMidnightProgramWindow(now), true)
})

test("22:00 UTC vara = 01:00 EEST, tot ziua nouă", () => {
  const now = new Date("2026-07-15T22:00:00.000Z")
  assert.equal(bucharestHour(now), 1)
  assert.equal(isMidnightProgramWindow(now), true)
})

test("21:00 UTC vara = 00:00 EEST, tot fereastră de program", () => {
  const now = new Date("2026-07-15T21:00:00.000Z")
  assert.equal(bucharestHour(now), 0)
  assert.equal(isMidnightProgramWindow(now), true)
})

test("21:00 UTC iarna = 23:00 EET, încă nu e ziua nouă", () => {
  const now = new Date("2026-01-15T21:00:00.000Z")
  assert.equal(bucharestHour(now), 23)
  assert.equal(isMidnightProgramWindow(now), false)
})
