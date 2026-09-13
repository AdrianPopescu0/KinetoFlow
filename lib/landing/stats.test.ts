import assert from "node:assert/strict"
import { test } from "node:test"

import { LANDING_STATS } from "./stats.ts"

test("cifrele de pe landing sunt 0 până la actualizare", () => {
  assert.equal(LANDING_STATS.length, 4)
  assert.deepEqual(
    LANDING_STATS.map((item) => item.label),
    ["pacienți monitorizați", "clinici partenere", "exerciții în bibliotecă", "terapeuți activi"],
  )
  assert.ok(LANDING_STATS.every((item) => item.value === 0))
})
