import assert from "node:assert/strict"
import { test } from "node:test"

import {
  computeExerciseDurationSeconds,
  earliestInstant,
  formatExerciseDuration,
  parseIsoInstant,
} from "./session-duration.ts"

test("parseIsoInstant respinge valori invalide", () => {
  assert.equal(parseIsoInstant(null), null)
  assert.equal(parseIsoInstant("nu-e-dată"), null)
  assert.ok(parseIsoInstant("2026-09-09T08:00:00.000Z") instanceof Date)
})

test("earliestInstant alege startul cel mai vechi", () => {
  const earliest = earliestInstant(
    "2026-09-09T08:10:00.000Z",
    "2026-09-09T08:00:00.000Z",
    null,
    "invalid",
  )
  assert.equal(earliest?.toISOString(), "2026-09-09T08:00:00.000Z")
})

test("computeExerciseDurationSeconds măsoară de la start până la trimitere", () => {
  const started = "2026-09-09T08:00:00.000Z"
  const ended = "2026-09-09T08:12:30.000Z"
  assert.equal(computeExerciseDurationSeconds(started, ended), 12 * 60 + 30)
  assert.equal(computeExerciseDurationSeconds(null, ended), null)
  assert.equal(computeExerciseDurationSeconds(ended, started), null)
})

test("computeExerciseDurationSeconds plafonează la 24h", () => {
  assert.equal(
    computeExerciseDurationSeconds("2026-09-08T08:00:00.000Z", "2026-09-10T08:00:00.000Z"),
    86_400,
  )
})

test("formatExerciseDuration arată minutele pentru terapeut", () => {
  assert.equal(formatExerciseDuration(null), "—")
  assert.equal(formatExerciseDuration(20), "< 1 min")
  assert.equal(formatExerciseDuration(0), "0 min")
  assert.equal(formatExerciseDuration(12 * 60), "12 min")
  assert.equal(formatExerciseDuration(65 * 60), "1 h 5 min")
  assert.equal(formatExerciseDuration(120 * 60), "2 h")
})
