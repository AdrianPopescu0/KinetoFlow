import assert from "node:assert/strict"
import { test } from "node:test"

import {
  isPersistedLibraryId,
  mergeLibraryCatalog,
  parseHiddenLibraryIds,
  serializeHiddenLibraryIds,
} from "./merge-catalog.ts"
import type { LibraryExercise } from "./types.ts"

function exercise(id: string, title: string, custom?: boolean): LibraryExercise {
  return {
    id,
    title,
    description: title,
    region: "lumbar",
    regions: ["lumbar"],
    subcategory: "mobility",
    objectives: ["mobility"],
    difficulty: "usor",
    equipment: "none",
    equipments: ["none"],
    position: "sitting",
    sets: 3,
    reps: 10,
    durationSeconds: 60,
    youtubeId: null,
    videoUrl: null,
    custom,
  }
}

test("isPersistedLibraryId recunoaște UUID-urile din exercise_library", () => {
  assert.equal(isPersistedLibraryId("a3f1c2e4-1234-4abc-8def-0123456789ab"), true)
  assert.equal(isPersistedLibraryId("chin-tuck"), false)
})

test("mergeLibraryCatalog pune stocatele primele și completează cu seed-ul", () => {
  const stored = [exercise("custom-1", "Custom", true)]
  const seeded = [exercise("chin-tuck", "Chin tuck"), exercise("custom-1", "Duplicate seed")]
  const merged = mergeLibraryCatalog(stored, seeded)
  assert.deepEqual(
    merged.map((item) => item.id),
    ["custom-1", "chin-tuck"],
  )
})

test("mergeLibraryCatalog ascunde id-uri din toată grila, nu doar primul card", () => {
  const stored = [exercise("custom-1", "Custom", true)]
  const seeded = [exercise("chin-tuck", "Chin tuck"), exercise("bridge", "Bridge")]
  const merged = mergeLibraryCatalog(stored, seeded, ["chin-tuck", "custom-1"])
  assert.deepEqual(
    merged.map((item) => item.id),
    ["bridge"],
  )
})

test("parse/serialize păstrează lista de id-uri ascunse", () => {
  const raw = serializeHiddenLibraryIds(["bridge", "chin-tuck", "bridge"])
  assert.deepEqual(parseHiddenLibraryIds(raw), ["bridge", "chin-tuck"])
  assert.deepEqual(parseHiddenLibraryIds("not-json"), [])
})
