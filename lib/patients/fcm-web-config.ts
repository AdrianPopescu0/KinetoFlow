import {
  firebasePublicEnv,
  getFirebaseOptions,
  getFirebaseVapidKey,
  isFirebaseWebConfigured as isFirebaseWebConfiguredFromEnv,
} from "../firebase.ts"

export type FirebaseWebConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
}

/** Config public pentru SDK-ul web Firebase (NEXT_PUBLIC_*). */
export function readFirebaseWebConfig(
  env: Record<string, string | undefined> = firebasePublicEnv(),
): FirebaseWebConfig | null {
  const options = getFirebaseOptions(env)
  if (
    !options?.apiKey ||
    !options.authDomain ||
    !options.projectId ||
    !options.appId ||
    !options.messagingSenderId
  ) {
    return null
  }
  return {
    apiKey: options.apiKey,
    authDomain: options.authDomain,
    projectId: options.projectId,
    storageBucket: options.storageBucket ?? "",
    messagingSenderId: options.messagingSenderId,
    appId: options.appId,
  }
}

export function readFirebaseVapidKey(env: Record<string, string | undefined> = firebasePublicEnv()): string | null {
  return getFirebaseVapidKey(env)
}

export function isFirebaseWebConfigured(env: Record<string, string | undefined> = firebasePublicEnv()): boolean {
  return isFirebaseWebConfiguredFromEnv(env)
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
