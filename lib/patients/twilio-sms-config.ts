import { toTwilioE164 } from "./phone.ts"

export type TwilioSmsEnv = {
  TWILIO_ACCOUNT_SID?: string
  TWILIO_AUTH_TOKEN?: string
  TWILIO_PHONE_NUMBER?: string
  TWILIO_SMS_FROM?: string
  TWILIO_FROM?: string
  TWILIO_WHATSAPP_FROM?: string
}

/**
 * Numărul From pentru SMS Twilio.
 * Pe Vercel se folosește de obicei TWILIO_PHONE_NUMBER; alias-urile rămân valide.
 */
export function resolveTwilioSmsFrom(env: TwilioSmsEnv = process.env): string | null {
  return (
    toTwilioE164(env.TWILIO_PHONE_NUMBER) ??
    toTwilioE164(env.TWILIO_SMS_FROM) ??
    toTwilioE164(env.TWILIO_FROM) ??
    toTwilioE164(env.TWILIO_WHATSAPP_FROM)
  )
}

/** SID + token + un număr From (TWILIO_PHONE_NUMBER sau alias). */
export function isTwilioSmsConfigured(env: TwilioSmsEnv = process.env): boolean {
  return Boolean(
    env.TWILIO_ACCOUNT_SID?.trim() && env.TWILIO_AUTH_TOKEN?.trim() && resolveTwilioSmsFrom(env),
  )
}

export function twilioSmsProviderFlags(env: TwilioSmsEnv = process.env): {
  twilioWhatsApp: boolean
  metaWhatsApp: boolean
  twilioSms: boolean
} {
  return {
    twilioWhatsApp: false,
    metaWhatsApp: false,
    twilioSms: isTwilioSmsConfigured(env),
  }
}
