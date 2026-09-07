"use client"

import { useEffect } from "react"

import {
  listenForForegroundPush,
  requestPatientPushToken,
  savePatientPushToken,
} from "@/lib/patients/fcm-client"
import { isPatientUuidToken } from "@/lib/patients/session"
import { toast } from "@/components/ui/toaster"

/** Reînnoiește tokenul FCM dacă permisiunea e deja dată și arată reminder-ele când tab-ul e deschis. */
export function PatientPushListener({ portalToken }: { portalToken: string }) {
  useEffect(() => {
    if (!isPatientUuidToken(portalToken)) {
      return
    }
    if (typeof window === "undefined" || !("Notification" in window)) {
      return
    }

    let cancelled = false
    let unsubscribe: (() => void) | undefined

    void (async () => {
      if (Notification.permission === "granted") {
        const result = await requestPatientPushToken()
        if (!cancelled && result.token) {
          await savePatientPushToken({ portalToken, fcmToken: result.token })
        }
      }

      unsubscribe = await listenForForegroundPush((payload) => {
        toast(payload.body || payload.title)
      })
    })()

    return () => {
      cancelled = true
      unsubscribe?.()
    }
  }, [portalToken])

  return null
}
