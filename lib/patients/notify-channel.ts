export type PatientNotifyChannel = "whatsapp" | "sms"

/** Canalul de trimitere după migrarea la Twilio SMS. */
export const DEFAULT_NOTIFY_CHANNEL: PatientNotifyChannel = "sms"

export function parseNotifyChannel(value: unknown): PatientNotifyChannel | null {
  return value === "whatsapp" || value === "sms" ? value : null
}

/**
 * Canalul efectiv folosit la trimitere și în cron.
 * Valorile vechi `whatsapp` (și lipsa canalului) sunt tratate ca SMS.
 */
export function resolveNotifyChannel(_value?: unknown): PatientNotifyChannel {
  return DEFAULT_NOTIFY_CHANNEL
}

export function notifyChannelLabel(channel: PatientNotifyChannel | null): string {
  if (channel === "whatsapp") {
    return "WhatsApp"
  }
  if (channel === "sms") {
    return "SMS"
  }
  return "Nesetat"
}
