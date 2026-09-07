import assert from "node:assert/strict"
import test from "node:test"

import { hydrateLibraryExercise } from "./hydrate.ts"
import { parseTagList, serializeTagList } from "./tags.ts"

test("parsează o valoare, lista CSV și JSON", () => {
  assert.deepEqual(parseTagList("mobility"), ["mobility"])
  assert.deepEqual(parseTagList("mobility,strength"), ["mobility", "strength"])
  assert.deepEqual(parseTagList('["mobility","posture"]'), ["mobility", "posture"])
  assert.deepEqual(parseTagList("{bands,ball}"), ["bands", "ball"])
})

test("serializarea păstrează ordinea și scoate duplicatele", () => {
  assert.equal(serializeTagList(["mobility", "strength", "mobility"]), "mobility,strength")
})

test("hydrate acceptă atât o valoare cât și liste multiple", () => {
  const single = hydrateLibraryExercise({
    id: "a",
    title: "Test",
    description: "Desc",
    region: "cervical",
    subcategory: "mobility",
    difficulty: "usor",
    equipment: "none",
    position: "sitting",
    sets: 3,
    reps: 10,
    durationSeconds: 60,
    youtubeId: null,
    videoUrl: null,
  })
  assert.deepEqual(single.regions, ["cervical"])
  assert.deepEqual(single.objectives, ["mobility"])

  const many = hydrateLibraryExercise({
    id: "b",
    title: "Test",
    description: "Desc",
    region: "cervical,lumbar",
    subcategory: "mobility,strength",
    difficulty: "usor",
    equipment: "bands,ball",
    position: "sitting",
    sets: 3,
    reps: 10,
    durationSeconds: 60,
    youtubeId: null,
    videoUrl: null,
  })
  assert.deepEqual(many.regions, ["cervical", "lumbar"])
  assert.deepEqual(many.objectives, ["mobility", "strength"])
  assert.deepEqual(many.equipments, ["bands", "ball"])
  assert.equal(many.region, "cervical")
  assert.equal(many.equipment, "bands")
})
