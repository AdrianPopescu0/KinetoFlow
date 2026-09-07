/* Firebase Cloud Messaging — background handler.
 * 1) Config din query string (înregistrat de client).
 * 2) Dacă lipsește, încarcă /api/firebase-web-config (NEXT_PUBLIC_* de pe server).
 */
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js")

function configFromQuery() {
  const params = new URL(self.location.href).searchParams
  const apiKey = params.get("apiKey") || ""
  const projectId = params.get("projectId") || ""
  const appId = params.get("appId") || ""
  const messagingSenderId = params.get("messagingSenderId") || ""
  if (!apiKey || !projectId || !appId || !messagingSenderId) {
    return null
  }
  return {
    apiKey,
    authDomain: params.get("authDomain") || `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: params.get("storageBucket") || `${projectId}.appspot.com`,
    messagingSenderId,
    appId,
  }
}

async function configFromApi() {
  try {
    const response = await fetch("/api/firebase-web-config", { cache: "no-store" })
    if (!response.ok) {
      return null
    }
    const payload = await response.json()
    return payload?.config || null
  } catch {
    return null
  }
}

function attachMessaging() {
  const messaging = firebase.messaging()
  messaging.onBackgroundMessage((payload) => {
    const title = payload.notification?.title || payload.data?.title || "KinetoFlow"
    const body =
      payload.notification?.body || payload.data?.body || "Reminder: completează check-in-ul de azi."
    const url = payload.data?.url || "/acces"
    return self.registration.showNotification(title, {
      body,
      data: { url },
    })
  })
}

const fromQuery = configFromQuery()
if (fromQuery) {
  firebase.initializeApp(fromQuery)
  attachMessaging()
} else {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      configFromApi().then((config) => {
        if (config && !firebase.apps.length) {
          firebase.initializeApp(config)
          attachMessaging()
        }
      }),
    )
  })
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = event.notification.data?.url || "/acces"
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      for (const client of clientsArr) {
        if ("focus" in client) {
          client.focus()
          if ("navigate" in client && url) {
            return client.navigate(url)
          }
          return client
        }
      }
      return self.clients.openWindow(url)
    }),
  )
})
