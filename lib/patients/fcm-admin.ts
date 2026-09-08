import "server-only"

import { createPrivateKey } from "node:crypto"

import { parseFirebaseServiceAccountJson } from "@/lib/patients/fcm-private-key"

import type { App, ServiceAccount } from "firebase-admin/app"
import type { Messaging } from "firebase-admin/messaging"

let messagingPromise: Promise<Messaging | null> | undefined

export function isFirebaseAdminConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  try {
    return Boolean(parseFirebaseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT))
  } catch {
    return false
  }
}

export function readFirebaseServiceAccount(env: NodeJS.ProcessEnv = process.env) {
  try {
    return parseFirebaseServiceAccountJson(env.FIREBASE_SERVICE_ACCOUNT)
  } catch {
    return null
  }
}

function privateKeyPem(account: { private_key?: unknown; privateKey?: unknown }): string | null {
  const raw = account.private_key ?? account.privateKey
  return typeof raw === "string" && raw.includes("BEGIN") ? raw : null
}

/** OpenSSL parse fără a apela Firebase `cert()`, ca să nu apară "Failed to parse private key". */
function canUsePrivateKey(pem: string): boolean {
  try {
    createPrivateKey(pem)
    return true
  } catch {
    return false
  }
}

async function createMessaging(): Promise<Messaging | null> {
  try {
    const serviceAccount = parseFirebaseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT)
    if (!serviceAccount) {
      return null
    }

    const pem = privateKeyPem(serviceAccount)
    if (!pem || !canUsePrivateKey(pem)) {
      return null
    }

    const [{ cert, getApps, initializeApp }, { getMessaging }] = await Promise.all([
      import("firebase-admin/app"),
      import("firebase-admin/messaging"),
    ])

    const existing: App | undefined = getApps()[0]
    const app =
      existing ??
      initializeApp({
        credential: cert(serviceAccount as ServiceAccount),
        projectId: String(serviceAccount.project_id ?? serviceAccount.projectId ?? ""),
      })
    return getMessaging(app)
  } catch {
    return null
  }
}

/** Push e opțional: eșec la cheie → `null`, fără log și fără throw. */
export async function getFirebaseMessagingAdmin(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = createMessaging().catch(() => null)
  }

  try {
    return await messagingPromise
  } catch {
    messagingPromise = Promise.resolve(null)
    return null
  }
}
