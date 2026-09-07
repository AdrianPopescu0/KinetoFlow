/* Firebase Cloud Messaging — trebuie să stea la /firebase-messaging-sw.js, fără query string.
 * Config-ul (NEXT_PUBLIC_*) vine sincron din /api/firebase-messaging-sw-env.
 */
importScripts("/api/firebase-messaging-sw-env")
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js")

if (self.FIREBASE_CONFIG && self.FIREBASE_CONFIG.apiKey && self.FIREBASE_CONFIG.messagingSenderId) {
  firebase.initializeApp(self.FIREBASE_CONFIG)
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

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(Promise.resolve())
})

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim())
})

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
