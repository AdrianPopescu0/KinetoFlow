import assert from "node:assert/strict"
import { test } from "node:test"

import { isAppLocale, parseAppLocale } from "./locale.ts"

test("recunoaște locale-ul aplicației", () => {
  assert.equal(isAppLocale("ro"), true)
  assert.equal(isAppLocale("en"), true)
  assert.equal(isAppLocale("fr"), false)
})

test("parsează preferința de limbă, cu română implicit", () => {
  assert.equal(parseAppLocale("EN"), "en")
  assert.equal(parseAppLocale("en-US"), "en")
  assert.equal(parseAppLocale(undefined, "nope"), "ro")
})
