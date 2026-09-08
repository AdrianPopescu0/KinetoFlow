import "server-only"

import { getFirebaseMessagingAdmin } from "@/lib/patients/fcm-admin"
import { deletePatientPushTokens } from "@/lib/patients/push-tokens"
import { reminderLog, reminderWarn } from "@/lib/reminders/log"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export type PushSendResult = {
  sent: boolean
  provider: "fcm" | "fcm-mock" | null
  successCount: number
  failureCount: number
  error?: string
}

const INVALID_TOKEN_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  "messaging/invalid-argument",
])

export async function sendPushToTokens(
  tokens: string[],
  input: { title: string; body: string; url: string },
): Promise<PushSendResult> {
  const unique = [...new Set(tokens.map((token) => token.trim()).filter(Boolean))]
  if (unique.length === 0) {
    return { sent: false, provider: null, successCount: 0, failureCount: 0, error: "Niciun token FCM." }
  }

  let messaging = null
  try {
    messaging = await getFirebaseMessagingAdmin()
  } catch {
    messaging = null
  }

  if (!messaging) {
    reminderLog("Firebase Admin lipsește — trimitere push simulată (dev/mock).", {
      tokenCount: unique.length,
      title: input.title,
      url: input.url,
    })
    return {
      sent: process.env.NODE_ENV !== "production",
      provider: "fcm-mock",
      successCount: process.env.NODE_ENV !== "production" ? unique.length : 0,
      failureCount: process.env.NODE_ENV === "production" ? unique.length : 0,
      error:
        process.env.NODE_ENV === "production"
          ? "Firebase Admin nu e configurat pe server."
          : undefined,
    }
  }

  try {
    const response = await messaging.sendEachForMulticast({
      tokens: unique,
      notification: {
        title: input.title,
        body: input.body,
      },
      data: {
        url: input.url,
        title: input.title,
        body: input.body,
      },
      webpush: {
        fcmOptions: {
          link: input.url,
        },
        notification: {
          title: input.title,
          body: input.body,
          icon: "/icon-192.png",
        },
      },
    })

    const staleTokens: string[] = []
    response.responses.forEach((item, index) => {
      if (item.success) {
        return
      }
      const code = item.error?.code ?? ""
      if (INVALID_TOKEN_CODES.has(code)) {
        staleTokens.push(unique[index] ?? "")
      } else {
        reminderWarn("FCM a eșuat pentru un dispozitiv.", {
          code,
          message: item.error?.message,
        })
      }
    })

    if (staleTokens.length > 0) {
      try {
        await deletePatientPushTokens(createServiceRoleClient(), staleTokens.filter(Boolean))
      } catch (error) {
        reminderWarn("Nu am putut șterge tokenurile FCM expirate.", {
          message: error instanceof Error ? error.message : "unknown",
        })
      }
    }

    const sent = response.successCount > 0
    return {
      sent,
      provider: "fcm",
      successCount: response.successCount,
      failureCount: response.failureCount,
      error: sent ? undefined : "Nicio notificare push nu a ajuns la dispozitiv.",
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "FCM request failed."
    reminderWarn("Trimitere FCM eșuată.", { message })
    return {
      sent: false,
      provider: "fcm",
      successCount: 0,
      failureCount: unique.length,
      error: message,
    }
  }
}
