import assert from "node:assert/strict"
import { test } from "node:test"

import { doseCountDraft, parseDoseCount, sanitizeDoseCountInput } from "./dose-input.ts"

test("parseDoseCount: golul e 0, parseInt pentru text, 0–99", () => {
  assert.equal(parseDoseCount(""), 0)
  assert.equal(parseDoseCount("   "), 0)
  assert.equal(parseDoseCount("0"), 0)
  assert.equal(parseDoseCount("08"), 8)
  assert.equal(parseDoseCount("12"), 12)
  assert.equal(parseDoseCount("99"), 99)
  assert.equal(parseDoseCount("100"), 99)
  assert.equal(parseDoseCount("-3"), 0)
  assert.equal(parseDoseCount("abc"), 0)
  assert.equal(parseDoseCount("7x"), 7)
})

test("sanitizeDoseCountInput lasă câmpul gol ca să poți șterge cifra", () => {
  assert.equal(sanitizeDoseCountInput(""), "")
  assert.equal(sanitizeDoseCountInput("3"), "3")
  assert.equal(sanitizeDoseCountInput("10"), "10")
  assert.equal(sanitizeDoseCountInput("0"), "0")
  assert.equal(sanitizeDoseCountInput("99"), "99")
  assert.equal(sanitizeDoseCountInput("100"), "99")
  assert.equal(sanitizeDoseCountInput("12a"), "12")
  assert.equal(sanitizeDoseCountInput("a"), "")
})

test("doseCountDraft normalizează numerele salvate", () => {
  assert.equal(doseCountDraft(3), "3")
  assert.equal(doseCountDraft(0), "0")
  assert.equal(doseCountDraft(120), "99")
  assert.equal(doseCountDraft(null, 10), "10")
  assert.equal(doseCountDraft(undefined, 0), "0")
})
