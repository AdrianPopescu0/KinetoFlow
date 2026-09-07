import assert from "node:assert/strict"
import test from "node:test"

import {
  OBJECTIVES,
  isTherapeuticObjective,
  normalizeObjective,
  subcategoryLabel,
} from "./taxonomy.ts"

test("obiectivele terapeutice sunt cele 5 variante universale", () => {
  assert.deepEqual(
    OBJECTIVES.map((item) => item.label),
    ["Mobilitate", "Forță", "Stabilitate", "Stretching", "Postură"],
  )
  assert.ok(isTherapeuticObjective("mobility"))
  assert.ok(isTherapeuticObjective("strength"))
  assert.ok(isTherapeuticObjective("stability"))
  assert.ok(isTherapeuticObjective("stretching"))
  assert.ok(isTherapeuticObjective("posture"))
  assert.equal(isTherapeuticObjective("neck-mobility"), false)
})

test("etichetele și valorile vechi se normalizează la noul set", () => {
  assert.equal(subcategoryLabel("mobility"), "Mobilitate")
  assert.equal(subcategoryLabel("strength"), "Forță")
  assert.equal(normalizeObjective("neck-mobility"), "mobility")
  assert.equal(normalizeObjective("core"), "stability")
  assert.equal(normalizeObjective("trap-stretch"), "stretching")
  assert.equal(normalizeObjective("unknown"), "mobility")
})
