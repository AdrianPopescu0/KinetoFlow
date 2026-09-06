import "server-only"

import { toTwilioE164, toWhatsAppNumber } from "@/lib/patients/phone"

export type WhatsAppSendResult = {
  sent: boolean
  provider: "twilio" | "meta" | null
  error?: string
}

/** Trimite un mesaj WhatsApp prin Twilio sau Meta Cloud. Fără provider configurat → sent: false. */
export async function sendWhatsAppMessage(
  phone: string,
  message: string,
): Promise<WhatsAppSendResult> {
  const to = toWhatsAppNumber(phone)
  if (!to) {
    console.warn("[checkin-reminders] WhatsApp: număr invalid, nu pot normaliza destinația.")
    return { sent: false, provider: null, error: "Număr invalid." }
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom =
    toTwilioE164(process.env.TWILIO_SMS_FROM) ??
    toTwilioE164(process.env.TWILIO_FROM) ??
    toTwilioE164(process.env.TWILIO_WHATSAPP_FROM)
  if (twilioSid && twilioToken && twilioFrom) {
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
        console.warn("[checkin-reminders] WhatsApp Twilio a eșuat.", {
          status: response.status,
          to: `***${to.slice(-4)}`,
          detail,
        })
        return { sent: false, provider: "twilio", error: `Twilio HTTP ${response.status}${detail}` }
      }
      return { sent: true, provider: "twilio" }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Twilio request failed."
      console.warn("[checkin-reminders] WhatsApp Twilio request failed.", { message })
      return { sent: false, provider: "twilio", error: message }
    }
  }

  const metaToken = process.env.WHATSAPP_CLOUD_TOKEN
  const metaPhoneId = process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(`https://graph.facebook.com/v21.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${metaToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: message },
        }),
      })
      if (!response.ok) {
        const detail = await readProviderError(response)
        console.warn("[checkin-reminders] WhatsApp Meta a eșuat.", {
          status: response.status,
          to: `***${to.slice(-4)}`,
          detail,
        })
        return { sent: false, provider: "meta", error: `Meta HTTP ${response.status}${detail}` }
      }
      return { sent: true, provider: "meta" }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Meta request failed."
      console.warn("[checkin-reminders] WhatsApp Meta request failed.", { message })
      return { sent: false, provider: "meta", error: message }
    }
  }

  console.warn("[checkin-reminders] Niciun provider WhatsApp configurat.", {
    hasTwilioSid: Boolean(process.env.TWILIO_ACCOUNT_SID?.trim()),
    hasTwilioToken: Boolean(process.env.TWILIO_AUTH_TOKEN?.trim()),
    hasTwilioWhatsAppFrom: Boolean(process.env.TWILIO_WHATSAPP_FROM?.trim()),
    hasMetaToken: Boolean(process.env.WHATSAPP_CLOUD_TOKEN?.trim()),
    hasMetaPhoneId: Boolean(process.env.WHATSAPP_CLOUD_PHONE_NUMBER_ID?.trim()),
  })
  return { sent: false, provider: null, error: "Niciun provider WhatsApp configurat." }
}

async function readProviderError(response: Response): Promise<string> {
  try {
    const text = (await response.text()).replace(/\s+/g, " ").trim()
    return text ? `: ${text.slice(0, 220)}` : ""
  } catch {
    return ""
  }
}
