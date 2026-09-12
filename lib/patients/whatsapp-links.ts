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

/** Chat WhatsApp doar cu numărul: `https://wa.me/40…` — fără text predefinit. */
export function patientWhatsAppMeHref(phone: string | null | undefined): string | null {
  const digits = phone ? toWhatsAppNumber(phone) : null
  if (!digits) {
    return null
  }
  return `https://wa.me/${digits}`
}

/** Official click-to-chat (mobile + desktop). Avoids in-app Next.js routing. */
export function patientWhatsAppHref(phone: string, message: string): string | null {
  const digits = toWhatsAppNumber(phone)
  if (!digits) {
    return null
  }
  if (!message.trim()) {
    return patientWhatsAppMeHref(phone)
  }
  return `https://api.whatsapp.com/send?phone=${digits}&text=${encodedWhatsAppText(message)}`
}

/** WhatsApp Web în browser: `web.whatsapp.com/send?phone=` — fără text dacă nu e dat. */
export function patientWhatsAppWebHref(phone: string | null | undefined, message?: string | null): string | null {
  const digits = phone ? toWhatsAppNumber(phone) : null
  if (!digits) {
    return null
  }
  if (!message?.trim()) {
    return `https://web.whatsapp.com/send?phone=${digits}`
  }
  return `https://web.whatsapp.com/send?phone=${digits}&text=${encodedWhatsAppText(message)}`
}

export const WHATSAPP_BLANK_TARGET = "_blank"
export const WHATSAPP_BLANK_REL = "noopener noreferrer"

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

export function whatsappBlankAnchorProps(href: string): {
  href: string
  target: typeof WHATSAPP_BLANK_TARGET
  rel: typeof WHATSAPP_BLANK_REL
  referrerPolicy: "no-referrer"
} {
  return {
    href,
    target: WHATSAPP_BLANK_TARGET,
    rel: WHATSAPP_BLANK_REL,
    referrerPolicy: "no-referrer",
  }
}

function openWhatsAppInNewTab(href: string): boolean {
  const opened = window.open(href, WHATSAPP_BLANK_TARGET, "noopener,noreferrer")
  if (opened) {
    try {
      opened.opener = null
    } catch {
      // Tab-ul e deja separat de pagina KinetoFlow.
    }
    return true
  }

  const anchor = document.createElement("a")
  anchor.href = href
  anchor.target = WHATSAPP_BLANK_TARGET
  anchor.rel = WHATSAPP_BLANK_REL
  anchor.referrerPolicy = "no-referrer"
  anchor.style.display = "none"
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  return true
}

/**
 * Opens WhatsApp in a new browser tab. Always preventDefault so Next.js cannot
 * treat the URL as an in-app route, and never replace the current dashboard tab.
 */
export function openExternalWhatsApp(
  event: { preventDefault: () => void; stopPropagation?: () => void },
  href: string | null | undefined,
): boolean {
  event.preventDefault()
  event.stopPropagation?.()
  if (!href || !isExternalWhatsAppUrl(href) || typeof window === "undefined") {
    return false
  }
  return openWhatsAppInNewTab(href)
}
