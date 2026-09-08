export type ReminderDelivery = "push" | "none"

/**
 * Reminderele de check-in se trimit exclusiv prin Web Push (FCM).
 * Fără token înregistrat, nu se trimite SMS sau WhatsApp.
 */
export function chooseReminderDelivery(input: { pushTokens: string[] }): ReminderDelivery {
  return input.pushTokens.length > 0 ? "push" : "none"
}
