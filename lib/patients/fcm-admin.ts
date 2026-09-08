import "server-only"

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app"
import { getMessaging, type Messaging } from "firebase-admin/messaging"

import {
  parseFirebaseServiceAccountJson,
  type FirebaseServiceAccountJson,
} from "@/lib/patients/fcm-private-key"

export function readFirebaseServiceAccount(
  env: NodeJS.ProcessEnv = process.env,
): FirebaseServiceAccountJson | null {
  return parseFirebaseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT)
}

export function isFirebaseAdminConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(readFirebaseServiceAccount(env))
}

let messagingSingleton: Messaging | null | undefined

/**
 * Inițializează Firebase Admin din `FIREBASE_SERVICE_ACCOUNT` (JSON.parse pe tot obiectul).
 * Cheia privată vine gata unescape-uită din JSON — fără FIREBASE_PRIVATE_KEY.
 */
export function getFirebaseMessagingAdmin(): Messaging | null {
  if (messagingSingleton !== undefined) {
    return messagingSingleton
  }

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw?.trim()) {
    messagingSingleton = null
    return null
  }

  let serviceAccount: FirebaseServiceAccountJson
  try {
    const parsed = parseFirebaseServiceAccountJson(raw)
    if (!parsed) {
      throw new Error("JSON-ul nu conține project_id, client_email și private_key.")
    }
    serviceAccount = parsed
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[fcm-admin] FIREBASE_SERVICE_ACCOUNT nu a putut fi citit cu JSON.parse.", message)
    messagingSingleton = null
    return null
  }

  try {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
        projectId: String(serviceAccount.project_id ?? serviceAccount.projectId ?? ""),
      })
    messagingSingleton = getMessaging(app)
    return messagingSingleton
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[fcm-admin] Nu am putut inițializa Firebase Admin din FIREBASE_SERVICE_ACCOUNT.", message)
    messagingSingleton = null
    return null
  }
}
