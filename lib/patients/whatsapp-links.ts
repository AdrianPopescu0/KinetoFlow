import { toWhatsAppNumber } from "./phone.ts"

function encodedWhatsAppText(message: string): string {
  return encodeURIComponent(message)
}

const WHATSAPP_HOSTS = new Set([
  "api.whatsapp.com",
  "wa.me",
  "www.wa.me",
  "web.whatsapp.com",
  "whatsapp.com",
  "www.whatsapp.com",
])

/** Official click-to-chat (mobile + desktop). Avoids in-app Next.js routing. */
export function patientWhatsAppHref(phone: string, message: string): string | null {
  const digits = toWhatsAppNumber(phone)
  if (!digits) {
    return null
  }
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodedWhatsAppText(message)}`
}

/** WhatsApp Web — useful on desktop; hide on phones where this URL often fails. */
export function patientWhatsAppWebHref(phone: string, message: string): string | null {
  const digits = toWhatsAppNumber(phone)
  if (!digits) {
    return null
  }
  return `https://web.whatsapp.com/send?phone=${digits}&text=${encodedWhatsAppText(message)}`
}

export function isExternalWhatsAppUrl(href: string | null | undefined): boolean {
  if (!href) {
    return false
  }
  try {
    const url = new URL(href)
    if (url.protocol !== "https:") {
      return false
    }
    return WHATSAPP_HOSTS.has(url.hostname.toLowerCase())
  } catch {
    return false
  }
}

/**
 * Opens WhatsApp outside the Next.js router. Always preventDefault so a broken
 * or relative href cannot navigate inside the dashboard.
 */
export function openExternalWhatsApp(
  event: { preventDefault: () => void },
  href: string | null | undefined,
): boolean {
  event.preventDefault()
  if (!href || !isExternalWhatsAppUrl(href) || typeof window === "undefined") {
    return false
  }
  const opened = window.open(href, "_blank", "noopener,noreferrer")
  if (!opened) {
    window.location.assign(href)
  }
  return true
}
