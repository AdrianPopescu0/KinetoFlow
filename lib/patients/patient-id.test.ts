import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isPatientRecordId,
  readPatientIdFromPathname,
  readPatientIdFromRouteOrProps,
  readPatientIdFromSaveArgs,
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

test("click-ul pe Salvează citește patient_id din props, useParams sau pathname", () => {
  const fromProps = "a3f1c2e4-1234-4abc-8def-0123456789ab"
  const fromRoute = "b4e2d3f5-2345-4bcd-9ef0-1234567890bc"

  assert.equal(
    readPatientIdFromRouteOrProps({
      patientId: fromProps,
      patient_id: fromProps,
      paramsId: fromRoute,
    }),
    fromProps,
  )
  assert.equal(
    readPatientIdFromRouteOrProps({
      patientId: "",
      paramsId: fromRoute,
    }),
    fromRoute,
  )
  assert.equal(
    readPatientIdFromRouteOrProps({
      paramsId: [fromRoute],
    }),
    fromRoute,
  )
  assert.equal(
    readPatientIdFromRouteOrProps({
      params: { id: fromRoute },
    }),
    fromRoute,
  )
  assert.equal(
    readPatientIdFromPathname(`/dashboard/patients/${fromRoute}?tab=notes`),
    fromRoute,
  )
  assert.equal(
    readPatientIdFromRouteOrProps({
      patientId: undefined,
      pathname: `/dashboard/patients/${fromProps}`,
    }),
    fromProps,
  )
  assert.equal(
    readPatientIdFromRouteOrProps({
      patientId: "",
      paramsId: undefined,
      pathname: "/dashboard",
    }),
    null,
  )
})

test("Server Action citește patient_id din primul argument, nu dintr-un câmp gol", () => {
  const fromRoute = "b4e2d3f5-2345-4bcd-9ef0-1234567890bc"
  const fromProps = "a3f1c2e4-1234-4abc-8def-0123456789ab"

  assert.equal(readPatientIdFromSaveArgs(fromRoute, { notes: "text" }), fromRoute)
  assert.equal(
    readPatientIdFromSaveArgs(undefined, { patient_id: fromProps, notes: "text" }),
    fromProps,
  )
  assert.equal(readPatientIdFromSaveArgs({ patient_id: fromProps, notes: "obiective" }), fromProps)

  const form = new FormData()
  form.set("patient_id", fromRoute)
  form.set("notes", "text")
  assert.equal(readPatientIdFromSaveArgs(fromProps, form), fromProps)
  assert.equal(readPatientIdFromSaveArgs("", form), fromRoute)
  assert.equal(readPatientIdFromSaveArgs(undefined, { notes: "text" }), null)
  assert.equal(readPatientIdFromSaveArgs("undefined", {}), null)
})
