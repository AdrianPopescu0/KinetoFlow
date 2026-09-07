import { NextResponse } from "next/server"

import { getFirebaseOptions, getFirebaseVapidKey, isFirebaseWebConfigured } from "@/lib/firebase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/** Config public pentru client + service worker. Fără secrete de server. */
export async function GET() {
  const options = getFirebaseOptions()
  const vapidKey = getFirebaseVapidKey()
  return NextResponse.json({
    configured: isFirebaseWebConfigured(),
    vapidKey,
    config: options,
  })
}
