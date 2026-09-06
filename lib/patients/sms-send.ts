import "server-only"

import { toWhatsAppNumber } from "@/lib/patients/phone"
import {
  isTwilioSmsConfigured,
  resolveTwilioSmsFrom,
} from "@/lib/patients/twilio-sms-config"

export type SmsSendResult = {
  sent: boolean
  provider: "twilio-sms" | null
  error?: string
}

export { isTwilioSmsConfigured, resolveTwilioSmsFrom }

/** From SMS: TWILIO_PHONE_NUMBER sau alias-urile vechi, fără prefix whatsapp:. */
export function twilioSmsFrom(): string | null {
  return resolveTwilioSmsFrom()
}

/** Trimite SMS prin Twilio. Fără număr From (TWILIO_PHONE_NUMBER) → sent: false. */
export async function sendSmsMessage(phone: string, message: string): Promise<SmsSendResult> {
  const to = toWhatsAppNumber(phone)
  if (!to) {
    console.warn("[checkin-reminders] SMS: număr invalid, nu pot normaliza destinația.")
    return { sent: false, provider: null, error: "Număr invalid." }
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim()
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim()
  const twilioFrom = twilioSmsFrom()
  if (!twilioSid || !twilioToken || !twilioFrom) {
    console.warn("[checkin-reminders] Niciun provider SMS configurat.", {
      hasTwilioSid: Boolean(twilioSid),
      hasTwilioToken: Boolean(twilioToken),
      hasTwilioPhoneNumber: Boolean(process.env.TWILIO_PHONE_NUMBER?.trim()),
      hasTwilioSmsFrom: Boolean(process.env.TWILIO_SMS_FROM?.trim()),
      hasTwilioFrom: Boolean(process.env.TWILIO_FROM?.trim()),
      hasResolvedFrom: Boolean(twilioFrom),
      twilioSms: isTwilioSmsConfigured(),
    })
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
      const detail = await readProviderError(response)
      console.warn("[checkin-reminders] SMS Twilio a eșuat.", {
        status: response.status,
        to: `***${to.slice(-4)}`,
        detail,
      })
      return { sent: false, provider: "twilio-sms", error: `Twilio SMS HTTP ${response.status}${detail}` }
    }
    return { sent: true, provider: "twilio-sms" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Twilio SMS request failed."
    console.warn("[checkin-reminders] SMS Twilio request failed.", { message })
    return { sent: false, provider: "twilio-sms", error: message }
  }
}

async function readProviderError(response: Response): Promise<string> {
  try {
    const text = (await response.text()).replace(/\s+/g, " ").trim()
    return text ? `: ${text.slice(0, 220)}` : ""
  } catch {
    return ""
  }
}
