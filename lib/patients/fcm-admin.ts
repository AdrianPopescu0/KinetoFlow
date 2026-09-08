import "server-only"

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app"
import { getMessaging, type Messaging } from "firebase-admin/messaging"

import {
  normalizeFirebasePrivateKey,
  parseFirebaseServiceAccountJson,
  type FirebaseServiceAccountFields,
} from "@/lib/patients/fcm-private-key"

function credentialFromAccount(account: FirebaseServiceAccountFields): ServiceAccount | null {
  const privateKey = normalizeFirebasePrivateKey(account.privateKey)
  if (!privateKey) {
    return null
  }
  return {
    projectId: account.projectId,
    clientEmail: account.clientEmail,
    privateKey,
  }
}

export function readFirebaseServiceAccount(
  env: NodeJS.ProcessEnv = process.env,
): FirebaseServiceAccountFields | null {
  const json = env.FIREBASE_SERVICE_ACCOUNT
  if (json) {
    const fromJson = parseFirebaseServiceAccountJson(json)
    if (fromJson) {
      return fromJson
    }
  }

  const projectId = env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = normalizeFirebasePrivateKey(env.FIREBASE_PRIVATE_KEY)
  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey }
  }
  return null
}

export function isFirebaseAdminConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(readFirebaseServiceAccount(env))
}

let messagingSingleton: Messaging | null | undefined

export function getFirebaseMessagingAdmin(): Messaging | null {
  if (messagingSingleton !== undefined) {
    return messagingSingleton
  }

  const account = readFirebaseServiceAccount()
  if (!account) {
    messagingSingleton = null
    return null
  }

  const serviceAccount = credentialFromAccount(account)
  if (!serviceAccount?.privateKey) {
    console.error("[fcm-admin] Cheia privată lipsește sau nu a putut fi transformată în PEM.")
    messagingSingleton = null
    return null
  }

  try {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert(serviceAccount),
        projectId: account.projectId,
      })
    messagingSingleton = getMessaging(app)
    return messagingSingleton
  } catch (error) {
    const message = error instanceof Error ? error.message : "Eroare necunoscută."
    console.error("[fcm-admin] Nu am putut inițializa Firebase Admin (cheie privată / OpenSSL).", message)
    messagingSingleton = null
    return null
  }
}
