"use client"

import { getFirebaseApp } from "@/lib/firebase"
import {
  firebaseMessagingSwUrl,
  isFirebaseWebConfigured,
  readFirebaseVapidKey,
  readFirebaseWebConfig,
  type FirebaseWebConfig,
} from "@/lib/patients/fcm-web-config"

export type FcmTokenResult = {
  token: string | null
  permission: NotificationPermission | "unsupported"
  error?: string
}

type ResolvedFirebase = {
  config: FirebaseWebConfig
  vapidKey: string
}

function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator
  )
}

function describePushError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Nu am putut obține tokenul FCM."
  if (/push service error/i.test(message) || /registration failed/i.test(message)) {
    return "Înregistrarea push a eșuat. Folosește cheia VAPID publică (Firebase → Cloud Messaging → Web Push certificates), nu cheia privată. În Brave, activează „Use Google services for push messaging”."
  }
  return message
}

/** Inline NEXT_PUBLIC_* sau, dacă lipsește din bundle, config-ul de pe server (runtime Vercel). */
async function resolveFirebaseWeb(): Promise<ResolvedFirebase | null> {
  if (isFirebaseWebConfigured()) {
    const config = readFirebaseWebConfig()
    const vapidKey = readFirebaseVapidKey()
    if (config && vapidKey) {
      return { config, vapidKey }
    }
  }

  try {
    const response = await fetch("/api/firebase-web-config", { cache: "no-store" })
    const payload = (await response.json()) as {
      configured?: boolean
      vapidKey?: string | null
      config?: FirebaseWebConfig | null
    }
    if (payload?.configured && payload.config?.apiKey && payload.vapidKey) {
      return { config: payload.config, vapidKey: payload.vapidKey }
    }
  } catch {
    // serverul nu are încă NEXT_PUBLIC_FIREBASE_*
  }
  return null
}

async function waitUntilActivated(registration: ServiceWorkerRegistration): Promise<void> {
  const pending = registration.installing ?? registration.waiting
  if (registration.active && !pending) {
    return
  }
  const worker = pending ?? registration.active
  if (!worker) {
    await navigator.serviceWorker.ready
    return
  }
  if (worker.state === "activated") {
    return
  }
  await new Promise<void>((resolve, reject) => {
    const onChange = () => {
      if (worker.state === "activated") {
        worker.removeEventListener("statechange", onChange)
        resolve()
      } else if (worker.state === "redundant") {
        worker.removeEventListener("statechange", onChange)
        reject(new Error("Service worker-ul push a devenit redundant înainte de activare."))
      }
    }
    worker.addEventListener("statechange", onChange)
  })
}

async function unregisterStaleMessagingWorkers(): Promise<void> {
  const registrations = await navigator.serviceWorker.getRegistrations()
  await Promise.all(
    registrations.map(async (registration) => {
      const scriptUrl = registration.active?.scriptURL ?? registration.installing?.scriptURL ?? ""
      if (scriptUrl.includes("firebase-messaging-sw.js?")) {
        await registration.unregister()
      }
    }),
  )
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!notificationsSupported()) {
    return null
  }
  await unregisterStaleMessagingWorkers()
  const registration = await navigator.serviceWorker.register(firebaseMessagingSwUrl(), {
    scope: "/",
    updateViaCache: "none",
  })
  await waitUntilActivated(registration)
  await navigator.serviceWorker.ready
  return registration
}

async function getMessagingInstance(config: FirebaseWebConfig) {
  const app = getFirebaseApp(config)
  if (!app) {
    return null
  }
  const { getMessaging, isSupported } = await import("firebase/messaging")
  if (!(await isSupported())) {
    return null
  }
  return getMessaging(app)
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

  const firebaseWeb = await resolveFirebaseWeb()
  if (!firebaseWeb) {
    return {
      token: process.env.NODE_ENV === "production" ? null : `mock-web:${crypto.randomUUID()}`,
      permission,
      error:
        process.env.NODE_ENV === "production"
          ? "Firebase Messaging nu e configurat pe acest site. Verifică NEXT_PUBLIC_FIREBASE_* pe Vercel și redesfășoară aplicația."
          : undefined,
    }
  }

  try {
    const registration = await registerMessagingServiceWorker()
    const messaging = await getMessagingInstance(firebaseWeb.config)
    if (!messaging || !registration?.active) {
      return {
        token: null,
        permission,
        error: "Notificările push nu sunt disponibile pe acest dispozitiv.",
      }
    }

    const { getToken } = await import("firebase/messaging")
    const token = await getToken(messaging, {
      vapidKey: firebaseWeb.vapidKey,
      serviceWorkerRegistration: registration,
    })
    return { token: token || null, permission }
  } catch (error) {
    return { token: null, permission, error: describePushError(error) }
  }
}

export async function listenForForegroundPush(
  onMessage: (payload: { title: string; body: string; url?: string }) => void,
): Promise<() => void> {
  if (!notificationsSupported()) {
    return () => undefined
  }
  const firebaseWeb = await resolveFirebaseWeb()
  if (!firebaseWeb) {
    return () => undefined
  }
  try {
    await registerMessagingServiceWorker()
    const messaging = await getMessagingInstance(firebaseWeb.config)
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
