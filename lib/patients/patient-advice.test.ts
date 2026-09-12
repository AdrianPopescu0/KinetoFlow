import assert from "node:assert/strict"
import { test } from "node:test"

import {
  DEFAULT_THERAPIST_CARD_COPY,
  displayTherapistAdvice,
  normalizePatientAdvice,
  PATIENT_ADVICE_MAX_LENGTH,
} from "./patient-advice.ts"

test("normalizează mesajul pentru pacient: trim, newline, lungime", () => {
  assert.equal(normalizePatientAdvice("  Evită ridicările\r\npeste 2 kg.  "), "Evită ridicările\npeste 2 kg.")
  assert.equal(normalizePatientAdvice(""), "")
  assert.equal(normalizePatientAdvice(null), "")
  assert.equal(normalizePatientAdvice(undefined), "")
  assert.equal(normalizePatientAdvice("x".repeat(PATIENT_ADVICE_MAX_LENGTH + 40)).length, PATIENT_ADVICE_MAX_LENGTH)
})

test("afișarea din portal folosește textul salvat sau copia implicită", () => {
  assert.equal(displayTherapistAdvice("  Respiră relaxat.  "), "Respiră relaxat.")
  assert.equal(displayTherapistAdvice("   "), DEFAULT_THERAPIST_CARD_COPY)
  assert.equal(displayTherapistAdvice(null), DEFAULT_THERAPIST_CARD_COPY)
})
