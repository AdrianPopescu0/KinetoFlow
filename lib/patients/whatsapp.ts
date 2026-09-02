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
  return `${publicSiteUrl()}/p/${token}`
}

export function patientAccessUrl(): string {
  return PATIENT_ACCESS_PAGE_URL
}

export function patientWhatsAppMessage(input: {
  fullName: string
  token: string
  accessCode: string
}): string {
  return [
    `Bună, ${input.fullName}! Sunt kinetoterapeutul tău de la KinetoFlow. Ți-am pregătit planul tău personalizat de exerciții.`,
    `Accesează aplicația aici: ${PATIENT_ACCESS_PAGE_URL}`,
    `Introdu numărul tău de telefon și codul tău unic de 8 cifre: ${input.accessCode}`,
    "Te rog să faci check-in-ul de durere înainte să începi exercițiile. Spor la recuperare!",
  ].join("\n")
}

export function patientWhatsAppHref(phone: string, message: string): string | null {
  const digits = toWhatsAppNumber(phone)
  if (!digits) {
    return null
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}
