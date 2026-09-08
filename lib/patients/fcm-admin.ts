import "server-only"

import { parseFirebaseServiceAccountJson } from "@/lib/patients/fcm-private-key"

import type { App, ServiceAccount } from "firebase-admin/app"
import type { Messaging } from "firebase-admin/messaging"

const UNAVAILABLE_WARNING =
  "Firebase Admin indisponibil. Aplicația continuă fără notificări push."

let messagingPromise: Promise<Messaging | null> | undefined
let didWarnUnavailable = false

function warnUnavailable(): void {
  if (didWarnUnavailable) {
    return
  }
  didWarnUnavailable = true
  console.warn(UNAVAILABLE_WARNING)
}

/**
 * Verifică doar prezența JSON-ului. Nu apelează `cert()` — OpenSSL nu rulează pe dashboard.
 */
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

async function createMessaging(): Promise<Messaging | null> {
  const serviceAccount = parseFirebaseServiceAccountJson(process.env.FIREBASE_SERVICE_ACCOUNT)
  if (!serviceAccount) {
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
}

/**
 * Încarcă Firebase Admin doar când e nevoie (trimitere push).
 * Cheie invalidă / OpenSSL: un `console.warn`, fără throw către dashboard.
 */
export async function getFirebaseMessagingAdmin(): Promise<Messaging | null> {
  if (!messagingPromise) {
    messagingPromise = createMessaging().catch(() => {
      warnUnavailable()
      return null
    })
  }

  try {
    return await messagingPromise
  } catch {
    warnUnavailable()
    messagingPromise = Promise.resolve(null)
    return null
  }
}
