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
