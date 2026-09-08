import assert from "node:assert/strict"
import { test } from "node:test"

import {
  patientHasCheckInToday,
  patientMatchesAssignmentScope,
  patientMatchesListFilter,
  sortPatientsForList,
  splitPatientsByTodayCheckIn,
} from "./dashboard-filter.ts"
import type { PatientListItem } from "./types-db.ts"

function patient(overrides: Partial<PatientListItem> & Pick<PatientListItem, "id" | "full_name">): PatientListItem {
  return {
    therapist_id: "t1",
    email: null,
    phone: null,
    diagnosis: null,
    clinical_notes: null,
    token: "token",
    access_code: "12345678",
    created_at: "2026-09-01T08:00:00.000Z",
    updated_at: null,
    assigned_therapist_id: "t1",
    notify_channel: "sms",
    lastVas: null,
    lastCheckInAt: null,
    activeDaysLast7: 0,
    frequencyWindowDays: 7,
    checkIns: [],
    ...overrides,
  }
}

test("patientHasCheckInToday recunoaște check-in-ul din calendarul București", () => {
  const now = new Date("2026-09-08T10:00:00.000+03:00")
  assert.equal(
    patientHasCheckInToday(
      patient({ id: "a", full_name: "Ana", lastCheckInAt: "2026-09-08T07:15:00.000Z" }),
      now,
    ),
    true,
  )
  assert.equal(
    patientHasCheckInToday(
      patient({ id: "b", full_name: "Dan", lastCheckInAt: "2026-09-07T15:00:00.000Z" }),
      now,
    ),
    false,
  )
  assert.equal(patientHasCheckInToday(patient({ id: "c", full_name: "Eva" }), now), false)
})

test("splitPatientsByTodayCheckIn împarte completați și în așteptare", () => {
  const now = new Date("2026-09-08T10:00:00.000+03:00")
  const ana = patient({
    id: "ana",
    full_name: "Ana Pop",
    lastCheckInAt: "2026-09-08T06:00:00.000Z",
    lastVas: 3,
  })
  const dan = patient({
    id: "dan",
    full_name: "Dan Ionescu",
    lastCheckInAt: "2026-09-07T18:00:00.000Z",
    lastVas: 5,
  })
  const eva = patient({ id: "eva", full_name: "Eva Marinescu" })

  const split = splitPatientsByTodayCheckIn([dan, eva, ana], now)
  assert.deepEqual(
    split.completed.map((item) => item.id),
    ["ana"],
  )
  assert.deepEqual(
    split.pending.map((item) => item.id),
    ["dan", "eva"],
  )
})

test("split-ul de check-in respectă pacienții din scope-ul terapeutului", () => {
  const now = new Date("2026-09-08T10:00:00.000+03:00")
  const mine = patient({
    id: "mine",
    full_name: "Pacientul meu",
    assigned_therapist_id: "t1",
    lastCheckInAt: "2026-09-08T06:00:00.000Z",
  })
  const other = patient({
    id: "other",
    full_name: "Coleg",
    assigned_therapist_id: "t2",
  })
  const scoped = [mine, other].filter((item) => patientMatchesAssignmentScope(item, "mine", "t1"))
  const split = splitPatientsByTodayCheckIn(scoped, now)
  assert.deepEqual(
    split.completed.map((item) => item.id),
    ["mine"],
  )
  assert.equal(split.pending.length, 0)
})

test("filtrul de alerte nu ascunde pacienții fără durere mare", () => {
  const calm = patient({ id: "calm", full_name: "Ana", lastVas: 2 })
  const alert = patient({ id: "alert", full_name: "Dan", lastVas: 8 })
  assert.equal(patientMatchesListFilter(calm, "alert"), true)
  assert.equal(patientMatchesListFilter(alert, "alert"), true)
})

test("sortPatientsForList pune VAS ≥ 7 sus, apoi după scor și nume", () => {
  const ana = patient({ id: "ana", full_name: "Ana Pop", lastVas: 2 })
  const dan = patient({ id: "dan", full_name: "Dan Ionescu", lastVas: 8 })
  const eva = patient({ id: "eva", full_name: "Eva Marinescu", lastVas: 9 })
  const ion = patient({ id: "ion", full_name: "Ion Pop", lastVas: 7 })
  const mia = patient({ id: "mia", full_name: "Mia Radu", lastVas: null })

  assert.deepEqual(
    sortPatientsForList([mia, ana, ion, dan, eva]).map((item) => item.id),
    ["eva", "dan", "ion", "ana", "mia"],
  )
})
