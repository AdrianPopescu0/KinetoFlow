import assert from "node:assert/strict"
import { test } from "node:test"

import {
  CHECKIN_ALREADY_SUBMITTED_MESSAGE,
  dailyCheckinFromRow,
  isUniqueCheckinConstraintError,
} from "./daily-checkin.ts"

test("unicitatea pe pacient + zi e recunoscută din eroarea Postgres", () => {
  assert.equal(isUniqueCheckinConstraintError({ code: "23505", message: "duplicate key" }), true)
  assert.equal(
    isUniqueCheckinConstraintError({
      code: "23505",
      message: 'duplicate key value violates unique constraint "check_ins_patient_local_date_uidx"',
    }),
    true,
  )
  assert.equal(isUniqueCheckinConstraintError({ code: "PGRST204", message: "column not found" }), false)
  assert.equal(isUniqueCheckinConstraintError(null), false)
})

test("check-in-ul existent e mapat ca prima evaluare a zilei", () => {
  const checkin = dailyCheckinFromRow(
    {
      vas_score: 4,
      sleep_quality: "odihnitor",
      notes: "Mai bine",
      energy_level: "buna",
      exercise_duration_seconds: 900,
      created_at: "2026-09-10T07:15:00.000Z",
      local_date: "2026-09-10",
    },
    "2026-09-10",
    ["ex-1"],
  )
  assert.equal(checkin.pain, 4)
  assert.equal(checkin.sleep, "odihnitor")
  assert.equal(checkin.localDate, "2026-09-10")
  assert.equal(checkin.energy, "buna")
  assert.equal(checkin.exerciseDurationSeconds, 900)
  assert.deepEqual(checkin.completedExerciseIds, ["ex-1"])
  assert.match(CHECKIN_ALREADY_SUBMITTED_MESSAGE, /deja/)
})
