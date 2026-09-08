import assert from "node:assert/strict"
import { test } from "node:test"

import {
  clinicAverageFrequency,
  countActiveFrequencyDays,
  formatRealFrequency,
  frequencyWindowDays,
  isLowRealFrequency,
} from "./compliance.ts"

test("formatRealFrequency arată zile active din fereastră", () => {
  assert.equal(formatRealFrequency(4, 7), "4/7")
  assert.equal(formatRealFrequency(0, 7), "0/7")
  assert.equal(formatRealFrequency(7, 7), "7/7")
})

test("frequencyWindowDays e 7 pentru pacienți vechi și mai scurtă pentru fișe noi", () => {
  const now = new Date("2026-09-08T10:00:00.000+03:00")
  assert.equal(frequencyWindowDays("2026-08-01T08:00:00.000Z", now), 7)
  assert.equal(frequencyWindowDays("2026-09-06T08:00:00.000Z", now), 3)
  assert.equal(frequencyWindowDays("2026-09-08T06:00:00.000Z", now), 1)
})

test("countActiveFrequencyDays numără zile unice cu check-in sau exercițiu", () => {
  const now = new Date("2026-09-08T12:00:00.000+03:00")
  const result = countActiveFrequencyDays({
    createdAt: "2026-08-01T08:00:00.000Z",
    checkInAt: ["2026-09-08T07:00:00.000Z", "2026-09-08T18:00:00.000Z", "2026-09-06T10:00:00.000Z"],
    exerciseCompletedOn: ["2026-09-07", "2026-09-06"],
    now,
  })
  assert.deepEqual(result, { activeDays: 3, windowDays: 7 })
})

test("zilele din afara ferestrei nu contează", () => {
  const now = new Date("2026-09-08T12:00:00.000+03:00")
  const result = countActiveFrequencyDays({
    createdAt: "2026-08-01T08:00:00.000Z",
    checkInAt: ["2026-08-20T10:00:00.000Z"],
    exerciseCompletedOn: ["2026-08-21"],
    now,
  })
  assert.deepEqual(result, { activeDays: 0, windowDays: 7 })
})

test("clinicAverageFrequency rotunjește media zilelor active", () => {
  assert.deepEqual(clinicAverageFrequency([]), { activeDays: 0, windowDays: 7 })
  assert.deepEqual(
    clinicAverageFrequency([{ activeDaysLast7: 7 }, { activeDaysLast7: 1 }, { activeDaysLast7: 3 }]),
    { activeDays: 4, windowDays: 7 },
  )
})

test("isLowRealFrequency e sub jumătate din fereastră", () => {
  assert.equal(isLowRealFrequency(0, 7), true)
  assert.equal(isLowRealFrequency(3, 7), true)
  assert.equal(isLowRealFrequency(4, 7), false)
  assert.equal(isLowRealFrequency(1, 3), true)
  assert.equal(isLowRealFrequency(2, 3), false)
})
