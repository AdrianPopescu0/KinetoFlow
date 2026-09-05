import "server-only"

import { isTwilioSmsConfigured, sendSmsMessage } from "@/lib/patients/sms-send"
import { sendWhatsAppMessage } from "@/lib/patients/whatsapp-send"

export type PatientNotifyChannel = "whatsapp" | "sms"

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

/**
 * WhatsApp întâi (Twilio sau Meta Cloud), apoi SMS Twilio dacă WhatsApp
 * nu e configurat sau trimiterea a eșuat.
 */
export async function sendPatientNotification(
  phone: string,
  message: string,
): Promise<PatientNotifyResult> {
  const whatsapp = await sendWhatsAppMessage(phone, message)
  if (whatsapp.sent) {
    return { sent: true, channel: "whatsapp", provider: whatsapp.provider }
  }

  const sms = await sendSmsMessage(phone, message)
  if (sms.sent) {
    return { sent: true, channel: "sms", provider: sms.provider }
  }

  const parts = [whatsapp.error, sms.error].filter((part): part is string => Boolean(part))
  return {
    sent: false,
    channel: null,
    provider: sms.provider ?? whatsapp.provider,
    error: parts.join(" ") || "Niciun canal de notificare configurat.",
  }
}
