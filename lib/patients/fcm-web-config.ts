export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

function trimEnv(value: string | undefined): string {
  return value?.trim() ?? ""
}

/** Config public pentru SDK-ul web Firebase (NEXT_PUBLIC_*). */
export function readFirebaseWebConfig(
  env: Record<string, string | undefined> = process.env,
): FirebaseWebConfig | null {
  const apiKey = trimEnv(env.NEXT_PUBLIC_FIREBASE_API_KEY)
  const authDomain = trimEnv(env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN)
  const projectId = trimEnv(env.NEXT_PUBLIC_FIREBASE_PROJECT_ID)
  const storageBucket = trimEnv(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)
  const messagingSenderId = trimEnv(env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID)
  const appId = trimEnv(env.NEXT_PUBLIC_FIREBASE_APP_ID)
  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId) {
    return null
  }
  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: storageBucket || `${projectId}.appspot.com`,
    messagingSenderId,
    appId,
  }
}

export function readFirebaseVapidKey(env: Record<string, string | undefined> = process.env): string | null {
  const key = trimEnv(env.NEXT_PUBLIC_FIREBASE_VAPID_KEY)
  return key || null
}

export function isFirebaseWebConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(readFirebaseWebConfig(env) && readFirebaseVapidKey(env))
}

export function firebaseMessagingSwUrl(config: FirebaseWebConfig): string {
  const params = new URLSearchParams({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    storageBucket: config.storageBucket,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  })
  return `/firebase-messaging-sw.js?${params.toString()}`
}
