export type PatientNotifyChannel = "whatsapp" | "sms"

export function parseNotifyChannel(value: unknown): PatientNotifyChannel | null {
  return value === "whatsapp" || value === "sms" ? value : null
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
