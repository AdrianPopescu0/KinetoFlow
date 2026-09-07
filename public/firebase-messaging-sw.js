/* Firebase Cloud Messaging — background handler.
 * Config-ul vine din query string (înregistrat din client, unde există NEXT_PUBLIC_*).
 */
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js")
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js")

const params = new URL(self.location.href).searchParams

firebase.initializeApp({
  apiKey: params.get("apiKey") || "",
  authDomain: params.get("authDomain") || "",
  projectId: params.get("projectId") || "",
  storageBucket: params.get("storageBucket") || "",
  messagingSenderId: params.get("messagingSenderId") || "",
  appId: params.get("appId") || "",
})

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
