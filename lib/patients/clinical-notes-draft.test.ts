import assert from "node:assert/strict"
import { test } from "node:test"

import { initialClinicalNotes } from "./clinical-notes-draft.ts"

test("fișa se deschide cu notița de pe server, nu cu draft-ul din browser", () => {
  assert.equal(initialClinicalNotes("patient-1", "Notă salvată în clinică"), "Notă salvată în clinică")
  assert.equal(initialClinicalNotes("patient-1", ""), "")
})
