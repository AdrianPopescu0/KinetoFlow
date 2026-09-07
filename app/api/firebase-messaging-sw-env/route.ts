import { getFirebaseOptions } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * JS sincron pentru importScripts din firebase-messaging-sw.js.
 * Service worker-ul nu poate folosi process.env; de aceea injectăm config-ul aici.
 */
export async function GET() {
  const config = getFirebaseOptions()
  const body = `self.FIREBASE_CONFIG = ${JSON.stringify(config)};`
  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-store",
      "Service-Worker-Allowed": "/",
    },
  })
}
