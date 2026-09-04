import "server-only"

import { toWhatsAppNumber } from "@/lib/patients/phone"

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
    return { sent: false, provider: null, error: "Număr invalid." }
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const twilioFrom = process.env.TWILIO_WHATSAPP_FROM
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`
      const body = new URLSearchParams({
        From: twilioFrom.startsWith("whatsapp:") ? twilioFrom : `whatsapp:${twilioFrom}`,
        To: `whatsapp:+${to}`,
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
        return { sent: false, provider: "twilio", error: `Twilio HTTP ${response.status}` }
      }
      return { sent: true, provider: "twilio" }
    } catch {
      return { sent: false, provider: "twilio", error: "Twilio request failed." }
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
        return { sent: false, provider: "meta", error: `Meta HTTP ${response.status}` }
      }
      return { sent: true, provider: "meta" }
    } catch {
      return { sent: false, provider: "meta", error: "Meta request failed." }
    }
  }

  return { sent: false, provider: null, error: "Niciun provider WhatsApp configurat." }
}
