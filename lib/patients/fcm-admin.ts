import "server-only"

import { cert, getApps, initializeApp, type ServiceAccount } from "firebase-admin/app"
import { getMessaging, type Messaging } from "firebase-admin/messaging"

type ServiceAccountFields = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function parseServiceAccountJson(raw: string): ServiceAccountFields | null {
  try {
    const parsed = JSON.parse(raw) as {
      project_id?: string
      projectId?: string
      client_email?: string
      clientEmail?: string
      private_key?: string
      privateKey?: string
    }
    const projectId = (parsed.project_id ?? parsed.projectId)?.trim()
    const clientEmail = (parsed.client_email ?? parsed.clientEmail)?.trim()
    const privateKey = (parsed.private_key ?? parsed.privateKey)?.replace(/\\n/g, "\n").trim()
    if (!projectId || !clientEmail || !privateKey) {
      return null
    }
    return { projectId, clientEmail, privateKey }
  } catch {
    return null
  }
}

export function readFirebaseServiceAccount(
  env: NodeJS.ProcessEnv = process.env,
): ServiceAccountFields | null {
  const json = env.FIREBASE_SERVICE_ACCOUNT?.trim()
  if (json) {
    const fromJson = parseServiceAccountJson(json)
    if (fromJson) {
      return fromJson
    }
  }

  const projectId = env.FIREBASE_PROJECT_ID?.trim()
  const clientEmail = env.FIREBASE_CLIENT_EMAIL?.trim()
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n").trim()
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

  const serviceAccount: ServiceAccount = {
    projectId: account.projectId,
    clientEmail: account.clientEmail,
    privateKey: account.privateKey,
  }

  const app =
    getApps()[0] ??
    initializeApp({
      credential: cert(serviceAccount),
      projectId: account.projectId,
    })

  messagingSingleton = getMessaging(app)
  return messagingSingleton
}
