import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isMissingClinicalNotesColumn,
  isMissingPatientNotesTable,
  isMissingSchemaObject,
} from "./schema-error.ts"

test("recunoaște eroarea de schema cache pentru clinical_notes pe patients", () => {
  assert.equal(
    isMissingClinicalNotesColumn({
      code: "PGRST204",
      message: "Could not find the 'clinical_notes' column of 'patients' in the schema cache",
    }),
    true,
  )
  assert.equal(
    isMissingSchemaObject(
      { message: "Could not find the 'clinical_notes' column of 'patients' in the schema cache" },
      "clinical_notes",
    ),
    true,
  )
  assert.equal(isMissingClinicalNotesColumn({ message: "Pacientul nu a fost găsit." }), false)
})

test("recunoaște tabela patient_notes lipsă", () => {
  assert.equal(
    isMissingPatientNotesTable({
      code: "PGRST205",
      message: "Could not find the table 'public.patient_notes' in the schema cache",
    }),
    true,
  )
  assert.equal(isMissingPatientNotesTable({ message: "relation patient_notes does not exist" }), true)
  assert.equal(isMissingPatientNotesTable({ message: "Nu am putut salva notițele." }), false)
})
