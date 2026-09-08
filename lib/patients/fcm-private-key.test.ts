import assert from "node:assert/strict"
import { test } from "node:test"

import { parseFirebaseServiceAccountJson } from "./fcm-private-key.ts"

const PEM = "-----BEGIN PRIVATE KEY-----\nMIIFakeBase64PayloadForTests\n-----END PRIVATE KEY-----\n"

function serviceAccountJson(extra: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: "service_account",
    project_id: "demo-project",
    client_email: "demo@demo-project.iam.gserviceaccount.com",
    private_key: PEM,
    ...extra,
  })
}

test("JSON.parse pe FIREBASE_SERVICE_ACCOUNT lasă private_key cu newline-uri reale", () => {
  const parsed = parseFirebaseServiceAccountJson(serviceAccountJson())
  assert.ok(parsed)
  assert.equal(parsed.project_id, "demo-project")
  assert.equal(parsed.client_email, "demo@demo-project.iam.gserviceaccount.com")
  assert.equal(parsed.private_key, PEM)
  assert.equal(String(parsed.private_key).includes("\n"), true)
  assert.equal(String(parsed.private_key).includes("\\n"), false)
})

test("acceptă JSON-ul pe un rând, cu \\n escapate ca în Vercel", () => {
  const raw = `{"type":"service_account","project_id":"demo","client_email":"a@b.c","private_key":"-----BEGIN PRIVATE KEY-----\\nMIIFake\\n-----END PRIVATE KEY-----\\n"}`
  const parsed = parseFirebaseServiceAccountJson(raw)
  assert.ok(parsed)
  assert.equal(parsed.project_id, "demo")
  assert.equal(parsed.private_key, "-----BEGIN PRIVATE KEY-----\nMIIFake\n-----END PRIVATE KEY-----\n")
})

test("dacă valoarea e un string JSON (dublu-encodat), parsează de două ori", () => {
  const parsed = parseFirebaseServiceAccountJson(JSON.stringify(serviceAccountJson()))
  assert.equal(parsed?.project_id, "demo-project")
  assert.equal(parsed?.private_key, PEM)
})

test("scoate un rând de ghilimele extra și apoi face JSON.parse", () => {
  const parsed = parseFirebaseServiceAccountJson(`'${serviceAccountJson()}'`)
  assert.equal(parsed?.project_id, "demo-project")
  assert.equal(parsed?.private_key, PEM)
})

test("respinge JSON incomplet sau invalid", () => {
  assert.equal(parseFirebaseServiceAccountJson(""), null)
  assert.equal(parseFirebaseServiceAccountJson("not-json"), null)
  assert.equal(parseFirebaseServiceAccountJson("{}"), null)
  assert.equal(parseFirebaseServiceAccountJson(JSON.stringify({ project_id: "demo" })), null)
  assert.equal(parseFirebaseServiceAccountJson(undefined), null)
})
