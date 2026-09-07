"use client"

import {
  firebaseMessagingSwUrl,
  isFirebaseWebConfigured,
  readFirebaseVapidKey,
  readFirebaseWebConfig,
} from "@/lib/patients/fcm-web-config"

export type FcmTokenResult = {
  token: string | null
  permission: NotificationPermission | "unsupported"
  error?: string
}

function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  )
}

async function getMessagingInstance() {
  const config = readFirebaseWebConfig()
  if (!config) {
    return null
  }
  const { getApps, initializeApp } = await import("firebase/app")
  const { getMessaging, isSupported } = await import("firebase/messaging")
  if (!(await isSupported())) {
    return null
  }
  const app = getApps()[0] ?? initializeApp(config)
  return getMessaging(app)
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!notificationsSupported()) {
    return null
  }
  const config = readFirebaseWebConfig()
  if (!config) {
    return null
  }
  const registration = await navigator.serviceWorker.register(firebaseMessagingSwUrl(config), {
    scope: "/",
  })
  await navigator.serviceWorker.ready
  return registration
}

export async function requestPatientPushToken(): Promise<FcmTokenResult> {
  if (!notificationsSupported()) {
    return { token: null, permission: "unsupported", error: "Acest browser nu suportă notificări push." }
  }

  let permission: NotificationPermission = Notification.permission
  if (permission === "default") {
    permission = await Notification.requestPermission()
  }
  if (permission !== "granted") {
    return { token: null, permission }
  }

  if (!isFirebaseWebConfigured()) {
    return {
      token: process.env.NODE_ENV === "production" ? null : `mock-web:${crypto.randomUUID()}`,
      permission,
      error:
        process.env.NODE_ENV === "production"
          ? "Firebase Messaging nu e configurat pe acest site."
          : undefined,
    }
  }

  const vapidKey = readFirebaseVapidKey()
  const messaging = await getMessagingInstance()
  if (!messaging || !vapidKey) {
    return {
      token: null,
      permission,
      error: "Notificările push nu sunt disponibile pe acest dispozitiv.",
    }
  }

  try {
    const registration = await registerMessagingServiceWorker()
    const { getToken } = await import("firebase/messaging")
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined,
    })
    return { token: token || null, permission }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut obține tokenul FCM."
    return { token: null, permission, error: message }
  }
}

export async function listenForForegroundPush(
  onMessage: (payload: { title: string; body: string; url?: string }) => void,
): Promise<() => void> {
  if (!isFirebaseWebConfigured() || !notificationsSupported()) {
    return () => undefined
  }
  try {
    const messaging = await getMessagingInstance()
    if (!messaging) {
      return () => undefined
    }
    const { onMessage: subscribe } = await import("firebase/messaging")
    return subscribe(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || "KinetoFlow"
      const body =
        payload.notification?.body || payload.data?.body || "Ai un reminder de check-in."
      const url = payload.data?.url
      onMessage({ title, body, url })
    })
  } catch {
    return () => undefined
  }
}

export async function savePatientPushToken(input: {
  portalToken: string
  fcmToken: string
}): Promise<{ ok: boolean; error?: string }> {
  const response = await fetch("/api/patient/push-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      token: input.portalToken,
      fcmToken: input.fcmToken,
    }),
  })
  const payload = (await response.json().catch(() => null)) as { error?: string } | null
  if (!response.ok) {
    return { ok: false, error: payload?.error ?? "Nu am putut salva notificările." }
  }
  return { ok: true }
}
