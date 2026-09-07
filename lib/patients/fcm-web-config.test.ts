import assert from "node:assert/strict"
import { test } from "node:test"

import { isFirebaseWebConfigured, readFirebaseWebConfig } from "./fcm-web-config.ts"

const complete = {
  NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyDummy",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "demo.firebaseapp.com",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: "demo",
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "demo.appspot.com",
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "123456",
  NEXT_PUBLIC_FIREBASE_APP_ID: "1:123456:web:abc",
  NEXT_PUBLIC_FIREBASE_VAPID_KEY: "B" + "x".repeat(86),
}

test("config web FCM e incompletă fără VAPID sau API key", () => {
  assert.equal(isFirebaseWebConfigured({}), false)
  assert.equal(readFirebaseWebConfig({}), null)
  assert.equal(isFirebaseWebConfigured({ ...complete, NEXT_PUBLIC_FIREBASE_VAPID_KEY: "" }), false)
  assert.equal(isFirebaseWebConfigured({ ...complete, NEXT_PUBLIC_FIREBASE_API_KEY: "" }), false)
})

test("config web FCM e validă cu toate cheile publice", () => {
  assert.equal(isFirebaseWebConfigured(complete), true)
  assert.equal(readFirebaseWebConfig(complete)?.projectId, "demo")
})
