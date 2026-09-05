/** Canonical WhatsApp digits: 40xxxxxxxxxx (no plus). */

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, "")
}

export function toWhatsAppNumber(phone: string): string | null {
  let digits = digitsOnly(phone)
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }
  if (digits.startsWith("0") && digits.length === 10) {
    digits = `40${digits.slice(1)}`
  }
  if (digits.startsWith("40") && digits.length === 11) {
    return digits
  }
  if (digits.length >= 10 && digits.length <= 15) {
    return digits
  }
  return null
}

export function normalizeStoredPhone(phone: string): string | null {
  return toWhatsAppNumber(phone)
}

export function phonesMatch(stored: string | null, input: string): boolean {
  const a = stored ? toWhatsAppNumber(stored) : null
  const b = toWhatsAppNumber(input)
  return Boolean(a && b && a === b)
}

/**
 * Link nativ SMS: `sms:+NUMAR_TELEFON?body=...`
 * Numărul vine din obiectul pacientului (normalizat 40xxxxxxxxxx).
 * Pe iOS, `patientSmsHrefForDevice` folosește `&body=` ca să completeze destinatarul.
 */
export function patientSmsHref(phone: string | null | undefined, body: string): string | null {
  const digits = phone ? toWhatsAppNumber(phone) : null
  if (!digits || !body.trim()) {
    return null
  }

  return `sms:+${digits}?body=${encodeURIComponent(body)}`
}

export function patientSmsHrefForDevice(phone: string | null | undefined, body: string): string | null {
  const href = patientSmsHref(phone, body)
  if (!href) {
    return null
  }

  const isIos =
    typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent)
  return isIos ? href.replace("?body=", "&body=") : href
}

export function openPatientSms(
  event: { preventDefault: () => void },
  phone: string | null | undefined,
  body: string,
) {
  const href = patientSmsHrefForDevice(phone, body)
  if (!href) {
    event.preventDefault()
    return
  }

  if (href.includes("&body=")) {
    event.preventDefault()
    window.location.href = href
  }
}
