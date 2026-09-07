import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app"

/**
 * NEXT_PUBLIC_* trebuie citite ca `process.env.NEXT_PUBLIC_FOO` (acces static).
 * Next.js le înlocuiește în bundle-ul de client doar așa — `process.env[name]` sau
 * `env.NEXT_PUBLIC_FOO` pe obiectul `process.env` ajunge gol în browser.
 */
export function firebasePublicEnv(): Record<string, string | undefined> {
  return {
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    NEXT_PUBLIC_FIREBASE_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY,
    NEXT_PUBLIC_FIREBASE_WEB_PUSH_CERTIFICATE: process.env.NEXT_PUBLIC_FIREBASE_WEB_PUSH_CERTIFICATE,
  }
}

function trim(value: string | undefined): string {
  return value?.trim() ?? ""
}

export function getFirebaseOptions(
  env: Record<string, string | undefined> = firebasePublicEnv(),
): FirebaseOptions | null {
  const apiKey = trim(env.NEXT_PUBLIC_FIREBASE_API_KEY)
  const projectId = trim(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  const appId = trim(env.NEXT_PUBLIC_FIREBASE_APP_ID)
  const messagingSenderId =
    trim(env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) || trim(env.NEXT_PUBLIC_FIREBASE_SENDER_ID)
  if (!apiKey || !projectId || !appId || !messagingSenderId) {
    return null
  }

  const authDomain = trim(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) || `${projectId}.firebaseapp.com`
  const storageBucket =
    trim(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) || `${projectId}.appspot.com`
  const measurementId = trim(env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID)

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  }
}

export function getFirebaseVapidKey(
  env: Record<string, string | undefined> = firebasePublicEnv(),
): string | null {
  const key =
    trim(env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) ||
    trim(env.NEXT_PUBLIC_FIREBASE_MESSAGING_VAPID_KEY) ||
    trim(env.NEXT_PUBLIC_FIREBASE_WEB_PUSH_CERTIFICATE)
  return key || null
}

export function isFirebaseWebConfigured(
  env: Record<string, string | undefined> = firebasePublicEnv(),
): boolean {
  return Boolean(getFirebaseOptions(env) && getFirebaseVapidKey(env))
}

export function getFirebaseApp(options?: FirebaseOptions | null): FirebaseApp | null {
  const resolved = options ?? getFirebaseOptions()
  if (!resolved) {
    return null
  }
  return getApps()[0] ?? initializeApp(resolved)
}
