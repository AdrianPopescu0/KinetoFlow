import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isPatientRecordId,
  readPatientIdFromSavePayload,
  readPatientRecordId,
} from "./patient-id.ts"

test("recunoaște UUID-ul fișei de pacient", () => {
  assert.equal(isPatientRecordId("a3f1c2e4-1234-4abc-8def-0123456789ab"), true)
  assert.equal(isPatientRecordId("  a3f1c2e4-1234-4abc-8def-0123456789ab  "), true)
  assert.equal(isPatientRecordId(""), false)
  assert.equal(isPatientRecordId("undefined"), false)
  assert.equal(isPatientRecordId("chin-tuck"), false)
})

test("payload-ul de salvare trebuie să conțină patient_id, nu un câmp gol", () => {
  const fromProps = "a3f1c2e4-1234-4abc-8def-0123456789ab"
  const fromRoute = "b4e2d3f5-2345-4bcd-9ef0-1234567890bc"

  assert.equal(readPatientRecordId(undefined, "", "undefined", fromProps), fromProps)
  assert.equal(readPatientRecordId({ patient_id: fromProps }), fromProps)
  assert.equal(readPatientRecordId(undefined, fromProps), fromProps)
  assert.equal(readPatientRecordId(null, "", undefined), null)

  assert.equal(
    readPatientIdFromSavePayload({
      patientId: fromProps,
      patient_id: fromProps,
    }),
    fromProps,
  )
  assert.equal(
    readPatientIdFromSavePayload({ patientId: undefined, patient_id: fromRoute }),
    fromRoute,
  )
  assert.equal(readPatientIdFromSavePayload({ patientId: "", patient_id: "   " }), null)
  assert.equal(readPatientIdFromSavePayload({}), null)
})
