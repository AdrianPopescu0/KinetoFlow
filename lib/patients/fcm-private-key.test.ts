import assert from "node:assert/strict"
import { test } from "node:test"

import {
  normalizeFirebasePrivateKey,
  parseFirebaseServiceAccountJson,
} from "./fcm-private-key.ts"

const BODY = "MIIFakeBase64PayloadForTestsPlusPaddingEquals=="
const CANONICAL = [
  "-----BEGIN PRIVATE KEY-----",
  "MIIFakeBase64PayloadForTestsPlusPaddingEquals==",
  "-----END PRIVATE KEY-----",
  "",
].join("\n")

test("înlocuiește \\n literale din Vercel cu PEM canonic", () => {
  const raw = `-----BEGIN PRIVATE KEY-----\\n${BODY}\\n-----END PRIVATE KEY-----\\n`
  assert.equal(normalizeFirebasePrivateKey(raw), CANONICAL)
})

test("scoate ghilimelele și escape-ul dublu (\\\\n)", () => {
  const raw = `"-----BEGIN PRIVATE KEY-----\\\\n${BODY}\\\\n-----END PRIVATE KEY-----\\\\n"`
  assert.equal(normalizeFirebasePrivateKey(raw), CANONICAL)
})

test("parsează valoarea ca string JSON (ghilimele + \\n)", () => {
  const raw = JSON.stringify(`-----BEGIN PRIVATE KEY-----\n${BODY}\n-----END PRIVATE KEY-----\n`)
  assert.equal(normalizeFirebasePrivateKey(raw), CANONICAL)
})

test("păstrează un PEM care are deja newline-uri reale", () => {
  const raw = `-----BEGIN RSA PRIVATE KEY-----\n${BODY}\n-----END RSA PRIVATE KEY-----\n`
  const normalized = normalizeFirebasePrivateKey(raw)
  assert.ok(normalized)
  assert.ok(normalized.startsWith("-----BEGIN RSA PRIVATE KEY-----\n"))
  assert.ok(normalized.includes(BODY.replace(/=/g, "").slice(0, 20)) || normalized.includes(BODY.slice(0, 20)))
  assert.ok(normalized.includes("-----END RSA PRIVATE KEY-----"))
  assert.equal(normalized.includes("\\n"), false)
})

test("reconstruiește PEM-ul lipit pe un singur rând, cu spații", () => {
  const raw = `  "-----BEGIN PRIVATE KEY----- ${BODY} -----END PRIVATE KEY-----"  `
  assert.equal(normalizeFirebasePrivateKey(raw), CANONICAL)
})

test("decodează PEM-ul întreg salvat ca Base64", () => {
  const pem = `-----BEGIN PRIVATE KEY-----\n${BODY}\n-----END PRIVATE KEY-----\n`
  const encoded = Buffer.from(pem, "utf8").toString("base64")
  assert.equal(normalizeFirebasePrivateKey(encoded), CANONICAL)
})

test("extrage cheia din JSON-ul contului de serviciu pus greșit în FIREBASE_PRIVATE_KEY", () => {
  const json = JSON.stringify({
    type: "service_account",
    project_id: "demo",
    client_email: "demo@demo.iam.gserviceaccount.com",
    private_key: `-----BEGIN PRIVATE KEY-----\n${BODY}\n-----END PRIVATE KEY-----\n`,
  })
  assert.equal(normalizeFirebasePrivateKey(json), CANONICAL)
})

test("este idempotent după prima normalizare", () => {
  const once = normalizeFirebasePrivateKey(`-----BEGIN PRIVATE KEY-----\\n${BODY}\\n-----END PRIVATE KEY-----`)
  assert.equal(normalizeFirebasePrivateKey(once), once)
})

test("respinge valori fără header PEM", () => {
  assert.equal(normalizeFirebasePrivateKey(""), null)
  assert.equal(normalizeFirebasePrivateKey("not-a-key"), null)
  assert.equal(normalizeFirebasePrivateKey(undefined), null)
})

test("parsează FIREBASE_SERVICE_ACCOUNT cu \\n literale în private_key", () => {
  const json = `{"project_id":"demo","client_email":"a@b.c","private_key":"-----BEGIN PRIVATE KEY-----\\n${BODY}\\n-----END PRIVATE KEY-----\\n"}`
  const parsed = parseFirebaseServiceAccountJson(json)
  assert.deepEqual(parsed, {
    projectId: "demo",
    clientEmail: "a@b.c",
    privateKey: CANONICAL,
  })
})

test("parsează JSON-ul contului dublu-escapat și cu ghilimele extra", () => {
  const inner = JSON.stringify({
    project_id: "demo",
    client_email: "a@b.c",
    private_key: `-----BEGIN PRIVATE KEY-----\n${BODY}\n-----END PRIVATE KEY-----\n`,
  })
  const parsed = parseFirebaseServiceAccountJson(`'${JSON.stringify(inner)}'`)
  assert.equal(parsed?.projectId, "demo")
  assert.equal(parsed?.privateKey, CANONICAL)
})
