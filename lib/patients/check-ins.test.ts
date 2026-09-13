import assert from "node:assert/strict"
import { test } from "node:test"

import { listCheckInsForPatient, listVasPointsForPatients, mapCheckInRow } from "./check-ins.ts"

test("rândul de check-in păstrează patient_id-ul pacientului, nu al terapeutului", () => {
  const row = mapCheckInRow({
    id: "c1",
    patient_id: "a3f1c2e4-1234-4abc-8def-0123456789ab",
    vas_score: 4,
    sleep_quality: "odihnitor",
    pain_type: "efort",
    notes: "ok",
    created_at: "2026-09-12T08:00:00.000Z",
    exercise_duration_seconds: 420,
    therapist_id: "should-be-ignored",
    user_id: "should-be-ignored",
  })

  assert.equal(row.patient_id, "a3f1c2e4-1234-4abc-8def-0123456789ab")
  assert.equal(row.vas_score, 4)
  assert.equal(row.exercise_duration_seconds, 420)
  assert.equal("therapist_id" in row, false)
  assert.equal("user_id" in row, false)
})

test("fără UUID de pacient nu se face fetch de monitorizare", async () => {
  const forbidden = {
    from() {
      throw new Error("nu trebuie apelat fără patient_id valid")
    },
  }

  assert.deepEqual(await listCheckInsForPatient(forbidden as never, ""), [])
  assert.deepEqual(await listCheckInsForPatient(forbidden as never, "demo"), [])
  assert.deepEqual(await listVasPointsForPatients(forbidden as never, ["not-a-uuid"]), [])
})

test("interogarea de istoric filtrează doar după patient_id", async () => {
  const filters: Array<{ column: string; value: unknown }> = []
  const patientId = "a3f1c2e4-1234-4abc-8def-0123456789ab"
  const supabase = {
    from(table: string) {
      assert.equal(table, "check_ins")
      const query = {
        select() {
          return this
        },
        eq(column: string, value: unknown) {
          filters.push({ column, value })
          return this
        },
        order() {
          return this
        },
        limit(value: number) {
          filters.push({ column: "limit", value })
          return Promise.resolve({
            data: [
              {
                id: "c1",
                patient_id: patientId,
                vas_score: 3,
                sleep_quality: null,
                pain_type: null,
                notes: null,
                created_at: "2026-09-12T08:00:00.000Z",
                exercise_duration_seconds: null,
              },
            ],
            error: null,
          })
        },
      }
      return query
    },
  }

  const rows = await listCheckInsForPatient(supabase as never, patientId)
  assert.deepEqual(filters, [
    { column: "patient_id", value: patientId },
    { column: "limit", value: 90 },
  ])
  assert.equal(rows.length, 1)
  assert.equal(rows[0]?.patient_id, patientId)
})

test("VAS-ul de dashboard limitează perioada și numărul de puncte", async () => {
  const calls: Array<{ method: string; value: unknown }> = []
  const patientId = "a3f1c2e4-1234-4abc-8def-0123456789ab"
  const supabase = {
    from() {
      return {
        select() {
          return this
        },
        in() {
          return this
        },
        order() {
          return this
        },
        gte(_column: string, value: unknown) {
          calls.push({ method: "gte", value })
          return this
        },
        limit(value: number) {
          calls.push({ method: "limit", value })
          return Promise.resolve({ data: [], error: null })
        },
      }
    },
  }

  await listVasPointsForPatients(supabase as never, [patientId], {
    since: "2026-08-13T00:00:00.000Z",
    limit: 800,
  })
  assert.deepEqual(calls, [
    { method: "gte", value: "2026-08-13T00:00:00.000Z" },
    { method: "limit", value: 800 },
  ])
})
