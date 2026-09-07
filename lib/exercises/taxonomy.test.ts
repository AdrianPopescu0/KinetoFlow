import assert from "node:assert/strict"
import test from "node:test"

import {
  OBJECTIVES,
  POSITIONS,
  REGIONS,
  isAnatomicalRegion,
  isExercisePosition,
  isTherapeuticObjective,
  normalizeObjective,
  normalizePosition,
  normalizeRegion,
  positionLabel,
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

test("pozițiile sunt cele 5 fundamentale din kinetoterapie", () => {
  assert.deepEqual(
    POSITIONS.map((item) => item.label),
    [
      "În picioare (Ortostatism)",
      "Așezat (Șezând)",
      "Culcat (Dorsal / Ventral / Lateral)",
      "Pe genunchi",
      "Atârnat",
    ],
  )
  assert.ok(isExercisePosition("standing"))
  assert.ok(isExercisePosition("sitting"))
  assert.ok(isExercisePosition("lying"))
  assert.ok(isExercisePosition("kneeling"))
  assert.ok(isExercisePosition("hanging"))
  assert.equal(positionLabel("lying"), "Culcat (Dorsal / Ventral / Lateral)")
  assert.equal(positionLabel("sitting"), "Așezat (Șezând)")
  assert.equal(normalizePosition("decubit"), "lying")
  assert.equal(normalizePosition("patrupedie"), "kneeling")
  assert.equal(normalizePosition("unknown"), "sitting")
})

test("regiunile anatomice nu mai includ Funcțional", () => {
  assert.deepEqual(
    REGIONS.map((item) => item.label),
    [
      "Coloană Cervicală",
      "Coloană Toracală",
      "Coloană Lombară",
      "Bazin & Pelvis",
      "Membru Superior",
      "Membru Inferior",
    ],
  )
  assert.equal(isAnatomicalRegion("functional"), false)
  assert.equal(normalizeRegion("functional"), "lower")
  assert.ok(isAnatomicalRegion("cervical"))
  assert.ok(isAnatomicalRegion("lower"))
})
