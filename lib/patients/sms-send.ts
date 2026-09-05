import "server-only"

import { toWhatsAppNumber } from "@/lib/patients/phone"

export type SmsSendResult = {
  sent: boolean
  provider: "twilio-sms" | null
  error?: string
}

function twilioSmsFrom(): string | null {
  const raw = process.env.TWILIO_SMS_FROM?.trim()
  if (!raw || raw.startsWith("whatsapp:")) {
    return null
  }
  if (raw.startsWith("+")) {
    return raw
  }
  const digits = toWhatsAppNumber(raw)
  return digits ? `+${digits}` : null
}

export function isTwilioSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID?.trim() &&
      process.env.TWILIO_AUTH_TOKEN?.trim() &&
      twilioSmsFrom(),
  )
}

/** Trimite SMS prin Twilio. Fără TWILIO_SMS_FROM → sent: false. */
export async function sendSmsMessage(phone: string, message: string): Promise<SmsSendResult> {
  const to = toWhatsAppNumber(phone)
  if (!to) {
    return { sent: false, provider: null, error: "Număr invalid." }
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const twilioFrom = twilioSmsFrom()
  if (!twilioSid || !twilioToken || !twilioFrom) {
    return { sent: false, provider: null, error: "Niciun provider SMS configurat." }
  }

  try {
    const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
    const body = new URLSearchParams({
      From: twilioFrom,
      To: `+${to}`,
      Body: message,
    })
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    })
    if (!response.ok) {
      return { sent: false, provider: "twilio-sms", error: `Twilio SMS HTTP ${response.status}` }
    }
    return { sent: true, provider: "twilio-sms" }
  } catch {
    return { sent: false, provider: "twilio-sms", error: "Twilio SMS request failed." }
  }
}
