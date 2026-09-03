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

export function patientWhatsAppMessage(input: {
  fullName: string
  clinicName: string
  accessCode: string
}): string {
  return [
    `Bună, ${input.fullName}! Sunt kinetoterapeutul tău de la ${input.clinicName}. Ți-am pregătit planul de recuperare de astăzi.`,
    "Intră în programul tău aici:",
    `👉 ${patientAccessUrlWithCode(input.accessCode)}`,
    "",
    `(Codul tău de acces este ${input.accessCode} și s-a completat automat).`,
    "Te rog să completezi check-in-ul de durere înainte de exerciții. Spor la mișcare!",
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
