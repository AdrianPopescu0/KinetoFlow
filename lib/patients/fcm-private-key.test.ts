import assert from "node:assert/strict"
import { test } from "node:test"

import { normalizeFirebasePrivateKey } from "./fcm-private-key.ts"

const BODY = "MIIFakeBase64PayloadForTests"

test("înlocuiește \\n literal din Vercel cu newline-uri PEM", () => {
  const raw = `-----BEGIN PRIVATE KEY-----\\n${BODY}\\n-----END PRIVATE KEY-----\\n`
  const normalized = normalizeFirebasePrivateKey(raw)
  assert.ok(normalized)
  assert.equal(normalized.includes("\\n"), false)
  assert.ok(normalized.startsWith("-----BEGIN PRIVATE KEY-----\n"))
  assert.ok(normalized.includes(`\n${BODY}\n`))
  assert.ok(normalized.includes("-----END PRIVATE KEY-----"))
})

test("scoate ghilimelele și escape-ul dublu (\\\\n)", () => {
  const raw = `"-----BEGIN PRIVATE KEY-----\\\\n${BODY}\\\\n-----END PRIVATE KEY-----\\\\n"`
  const normalized = normalizeFirebasePrivateKey(raw)
  assert.ok(normalized)
  assert.equal(normalized.includes("\\n"), false)
  assert.ok(normalized.startsWith("-----BEGIN PRIVATE KEY-----\n"))
})

test("păstrează un PEM care are deja newline-uri reale", () => {
  const raw = `-----BEGIN RSA PRIVATE KEY-----\n${BODY}\n-----END RSA PRIVATE KEY-----\n`
  const normalized = normalizeFirebasePrivateKey(raw)
  assert.equal(normalized, raw.endsWith("\n") ? raw : `${raw}\n`)
})

test("respinge valori fără header PEM", () => {
  assert.equal(normalizeFirebasePrivateKey(""), null)
  assert.equal(normalizeFirebasePrivateKey("not-a-key"), null)
  assert.equal(normalizeFirebasePrivateKey(undefined), null)
})
