import "server-only"

import type { PatientNotifyChannel } from "@/lib/patients/notify-channel"
import { isTwilioSmsConfigured, sendSmsMessage } from "@/lib/patients/sms-send"
import { sendWhatsAppMessage } from "@/lib/patients/whatsapp-send"

export type { PatientNotifyChannel }

export type PatientNotifyResult = {
  sent: boolean
  channel: PatientNotifyChannel | null
  provider: "twilio" | "meta" | "twilio-sms" | null
  error?: string
}

export function isWhatsAppNotifyConfigured(): boolean {
  const twilioReady = Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      process.env.TWILIO_WHATSAPP_FROM?.trim(),
  )
  const metaReady = Boolean(
    process.env.WHATSAPP_CLOUD_TOKEN?.trim() && process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim(),
  )
  return twilioReady || metaReady
}

export function configuredNotifyChannels(): { whatsapp: boolean; sms: boolean } {
  return {
    whatsapp: isWhatsAppNotifyConfigured(),
    sms: isTwilioSmsConfigured(),
  }
}

/** Trimite doar pe canalul cerut — fără fallback pe celălalt. */
export async function sendPatientNotification(
  phone: string,
  message: string,
  channel: PatientNotifyChannel,
): Promise<PatientNotifyResult> {
  if (channel === "whatsapp") {
    const whatsapp = await sendWhatsAppMessage(phone, message)
    return {
      sent: whatsapp.sent,
      channel: "whatsapp",
      provider: whatsapp.provider,
      error: whatsapp.error,
    }
  }

  const sms = await sendSmsMessage(phone, message)
  return {
    sent: sms.sent,
    channel: "sms",
    provider: sms.provider,
    error: sms.error,
  }
}
