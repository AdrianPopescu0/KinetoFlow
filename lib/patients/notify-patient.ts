import "server-only"

import {
  DEFAULT_NOTIFY_CHANNEL,
  resolveNotifyChannel,
  type PatientNotifyChannel,
} from "@/lib/patients/notify-channel"
import { isTwilioSmsConfigured, sendSmsMessage } from "@/lib/patients/sms-send"

export type { PatientNotifyChannel }

export type PatientNotifyResult = {
  sent: boolean
  channel: PatientNotifyChannel
  provider: "twilio-sms" | null
  error?: string
}

export function configuredNotifyChannels(): { whatsapp: boolean; sms: boolean } {
  return {
    whatsapp: false,
    sms: isTwilioSmsConfigured(),
  }
}

/** Trimite mereu prin SMS Twilio. Canalul `whatsapp` e tratat ca SMS. */
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
