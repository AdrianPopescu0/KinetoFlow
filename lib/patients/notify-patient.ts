import "server-only"

import {
  DEFAULT_NOTIFY_CHANNEL,
  resolveNotifyChannel,
  type PatientNotifyChannel,
} from "@/lib/patients/notify-channel"
import { isFirebaseAdminConfigured } from "@/lib/patients/fcm-admin"
import { isTwilioSmsConfigured, sendSmsMessage } from "@/lib/patients/sms-send"

export type { PatientNotifyChannel }

export type PatientNotifyResult = {
  sent: boolean
  channel: PatientNotifyChannel
  provider: "twilio-sms" | null
  error?: string
}

/** Canale disponibile pentru invitații (SMS Twilio). WhatsApp nu e folosit la trimitere. */
export function configuredNotifyChannels(): { whatsapp: boolean; sms: boolean; push: boolean } {
  try {
    return {
      whatsapp: false,
      sms: isTwilioSmsConfigured(),
      push: isFirebaseAdminConfigured(),
    }
  } catch {
    return { whatsapp: false, sms: false, push: false }
  }
}

/** Reminderele de check-in merg exclusiv prin FCM. SMS/WhatsApp sunt oprite pe acest canal. */
export function configuredReminderChannels(): { whatsapp: boolean; sms: boolean; push: boolean } {
  try {
    return {
      whatsapp: false,
      sms: false,
      push: isFirebaseAdminConfigured(),
    }
  } catch {
    return { whatsapp: false, sms: false, push: false }
  }
}

/** Trimite invitație prin SMS Twilio. Reminder-ele de check-in nu folosesc această funcție. */
export async function sendPatientNotification(
  phone: string,
  message: string,
  _channel?: PatientNotifyChannel | null,
): Promise<PatientNotifyResult> {
  const channel = resolveNotifyChannel(_channel)
  const sms = await sendSmsMessage(phone, message)
  return {
    sent: sms.sent,
    channel,
    provider: sms.provider,
    error: sms.error,
  }
}

export { DEFAULT_NOTIFY_CHANNEL }
