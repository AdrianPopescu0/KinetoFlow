export type ReminderDelivery = "push" | "sms" | "none"

/**
 * Push are prioritate față de SMS/WhatsApp atunci când pacientul a salvat un token FCM.
 * Fără token, rămâne SMS (dacă există telefon + cod).
 */
export function chooseReminderDelivery(input: {
  pushTokens: string[]
  hasValidPhone: boolean
  hasAccessCode: boolean
}): ReminderDelivery {
  if (input.pushTokens.length > 0) {
    return "push"
  }
  if (input.hasValidPhone && input.hasAccessCode) {
    return "sms"
  }
  return "none"
}
