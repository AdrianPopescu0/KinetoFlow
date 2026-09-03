import { toWhatsAppNumber } from "@/lib/patients/phone"

export const PATIENT_ACCESS_PAGE_URL = "https://kinetoflow96.vercel.app/acces"

export function publicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) {
    return fromEnv
  }
  return "https://kinetoflow96.vercel.app"
}

export function patientPortalUrl(token: string): string {
  return `${publicSiteUrl()}/patient/${token}`
}

export function patientAccessUrl(): string {
  return PATIENT_ACCESS_PAGE_URL
}

/** Link de acces cu codul precompletat: pacientul nu mai tastează cele 8 cifre. */
export function patientAccessUrlWithCode(accessCode: string): string {
  const code = accessCode.trim()
  return code ? `${PATIENT_ACCESS_PAGE_URL}?code=${encodeURIComponent(code)}` : PATIENT_ACCESS_PAGE_URL
}

/** Backticks triple = monospace în WhatsApp; codul stă singur pe linie ca să fie ușor de copiat. */
function monospace(value: string): string {
  return `\`\`\`${value}\`\`\``
}

export function patientWhatsAppMessage(input: {
  fullName: string
  token: string
  accessCode: string
}): string {
  return [
    `Bună, ${input.fullName}! Sunt kinetoterapeutul tău de la KinetoFlow. Ți-am pregătit planul tău personalizat de exerciții.`,
    "",
    "Intră direct în program de aici (un singur tap, fără parolă):",
    patientPortalUrl(input.token),
    "",
    `Dacă linkul nu se deschide, folosește ${patientAccessUrlWithCode(input.accessCode)} — codul e deja completat, mai adaugi doar numărul de telefon.`,
    "",
    "Codul tău unic de 8 cifre:",
    monospace(input.accessCode),
    "",
    "Te rog să faci check-in-ul de durere înainte să începi exercițiile. Spor la recuperare!",
  ].join("\n")
}

function encodedWhatsAppText(message: string): string {
  return encodeURIComponent(message)
}

/** Click-to-chat for the native WhatsApp app (Windows/Mac/mobile). */
export function patientWhatsAppHref(phone: string, message: string): string | null {
  const digits = toWhatsAppNumber(phone)
  if (!digits) {
    return null
  }
  return `https://wa.me/${digits}?text=${encodedWhatsAppText(message)}`
}

/** Opens WhatsApp Web in a new tab — avoids OS “open in app?” dialogs on Linux/PC. */
export function patientWhatsAppWebHref(phone: string, message: string): string | null {
  const digits = toWhatsAppNumber(phone)
  if (!digits) {
    return null
  }
  return `https://web.whatsapp.com/send?phone=${digits}&text=${encodedWhatsAppText(message)}`
}
