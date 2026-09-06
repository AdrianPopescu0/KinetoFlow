const PREFIX = "[checkin-reminders]"

export function reminderLog(event: string, details?: Record<string, unknown>): void {
  if (details) {
    console.info(PREFIX, event, details)
    return
  }
  console.info(PREFIX, event)
}

export function reminderWarn(event: string, details?: Record<string, unknown>): void {
  if (details) {
    console.warn(PREFIX, event, details)
    return
  }
  console.warn(PREFIX, event)
}

/** Ultimele 4 cifre, fără număr complet în loguri. */
export function maskPhone(phone: string | null | undefined): string | null {
  if (!phone) {
    return null
  }
  const digits = phone.replace(/\D/g, "")
  if (digits.length < 4) {
    return "(număr prea scurt)"
  }
  return `${"*".repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`
}

export function providerFlags(): {
  twilioWhatsApp: boolean
  metaWhatsApp: boolean
  twilioSms: boolean
} {
  return {
    twilioWhatsApp: Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_WHATSAPP_FROM?.trim(),
    ),
    metaWhatsApp: Boolean(
      process.env.WHATSAPP_CLOUD_TOKEN?.trim() && process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim(),
    ),
    twilioSms: Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        (process.env.TWILIO_SMS_FROM?.trim() || process.env.TWILIO_WHATSAPP_FROM?.trim()),
    ),
  }
}
