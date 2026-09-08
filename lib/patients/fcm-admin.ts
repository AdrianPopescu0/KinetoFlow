import "server-only"

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app"
import { getMessaging, type Messaging } from "firebase-admin/messaging"

import {
  parseFirebaseServiceAccountJson,
  type FirebaseServiceAccountJson,
} from "@/lib/patients/fcm-private-key"

const UNAVAILABLE_WARNING =
  "Firebase Admin indisponibil. Aplicația continuă fără notificări push."

let messagingSingleton: Messaging | null | undefined
let didWarnUnavailable = false

function warnUnavailable(): void {
  if (didWarnUnavailable) {
    return
  }
  didWarnUnavailable = true
  console.warn(UNAVAILABLE_WARNING)
}

export function readFirebaseServiceAccount(
  env: NodeJS.ProcessEnv = process.env,
): FirebaseServiceAccountJson | null {
  try {
    return parseFirebaseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT)
  } catch {
    warnUnavailable()
    return null
  }
}

/**
 * True doar dacă Firebase Admin s-a inițializat cu succes.
 * JSON prezent dar cheie invalidă → false, fără throw.
 */
export function isFirebaseAdminConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    if (env !== process.env) {
      return Boolean(readFirebaseServiceAccount(env))
    }
    return getFirebaseMessagingAdmin() !== null
  } catch {
    warnUnavailable()
    return false
  }
}

function createMessaging(): Messaging | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw?.trim()) {
    return null
  }

  const serviceAccount = parseFirebaseServiceAccountJson(raw)
  if (!serviceAccount) {
    warnUnavailable()
    return null
  }

  const existing = getApps()[0]
  const app =
    existing ??
    initializeApp({
      credential: cert(serviceAccount as ServiceAccount),
      projectId: String(serviceAccount.project_id ?? serviceAccount.projectId ?? ""),
    })
  return getMessaging(app)
}

/**
 * Inițializează Firebase Admin din `FIREBASE_SERVICE_ACCOUNT`.
 * Orice eșec (JSON invalid, cheie PEM, OpenSSL) e înghițit: un warn în consolă, `null`.
 */
export function getFirebaseMessagingAdmin(): Messaging | null {
  if (messagingSingleton !== undefined) {
    return messagingSingleton
  }

  try {
    messagingSingleton = createMessaging()
  } catch {
    warnUnavailable()
    messagingSingleton = null
  }

  return messagingSingleton
}
