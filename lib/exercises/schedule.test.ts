import assert from "node:assert/strict"
import { test } from "node:test"

import {
  composeIntervalExerciseNotes,
  isExerciseActiveOnDate,
  parseScheduledWeekdaysFromNotes,
  weekdayIdFromDateKey,
} from "./schedule.ts"

test("5 zile consecutive: activ doar în interval", () => {
  const notes = composeIntervalExerciseNotes("3x10", "2026-09-01", "2026-09-05")
  assert.equal(isExerciseActiveOnDate(notes, "2026-08-31"), false)
  assert.equal(isExerciseActiveOnDate(notes, "2026-09-01"), true)
  assert.equal(isExerciseActiveOnDate(notes, "2026-09-03"), true)
  assert.equal(isExerciseActiveOnDate(notes, "2026-09-05"), true)
  assert.equal(isExerciseActiveOnDate(notes, "2026-09-06"), false)
})

test("fără perioadă, exercițiile vechi rămân active", () => {
  assert.equal(isExerciseActiveOnDate("Doar note clinice", "2026-09-06"), true)
  assert.equal(isExerciseActiveOnDate(null, "2026-09-06"), true)
})

test("Program: zilele săptămânii restricționează ziua", () => {
  const notes = "Program: Luni, Miercuri\n3x10"
  assert.deepEqual(parseScheduledWeekdaysFromNotes(notes), ["lu", "mi"])
  assert.equal(weekdayIdFromDateKey("2026-09-07"), "lu")
  assert.equal(isExerciseActiveOnDate(notes, "2026-09-07"), true)
  assert.equal(isExerciseActiveOnDate(notes, "2026-09-08"), false)
})
