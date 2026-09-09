import assert from "node:assert/strict"
import { test } from "node:test"

import { allExercisesCompleted } from "./checkin-exercises.ts"

test("fără exerciții, check-in-ul e permis", () => {
  assert.equal(allExercisesCompleted([], []), true)
  assert.equal(allExercisesCompleted([], ["x"]), true)
})

test("toate exercițiile trebuie bifate", () => {
  assert.equal(allExercisesCompleted(["a", "b"], ["a"]), false)
  assert.equal(allExercisesCompleted(["a", "b"], ["a", "b"]), true)
  assert.equal(allExercisesCompleted(["a", "b"], ["b", "a", "extra"]), true)
})

test("id-urile goale nu trec drept bifate", () => {
  assert.equal(allExercisesCompleted([""], []), false)
})
