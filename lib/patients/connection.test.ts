import assert from "node:assert/strict"
import { test } from "node:test"

import { isBrowserOnline, isLikelyOfflineError } from "./connection.ts"

test("fără navigator, considerăm că e online (SSR)", () => {
  assert.equal(isBrowserOnline(), true)
})

test("recunoaște erorile de rețea", () => {
  assert.equal(isLikelyOfflineError(new TypeError("Failed to fetch")), true)
  assert.equal(isLikelyOfflineError(new Error("NetworkError when attempting to fetch")), true)
  assert.equal(isLikelyOfflineError(new Error("Check-in invalid")), false)
  assert.equal(isLikelyOfflineError(null), false)
})
