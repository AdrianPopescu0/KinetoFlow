import { toWhatsAppNumber } from "@/lib/patients/phone"

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

export function patientWhatsAppMessage(input: {
  fullName: string
  token: string
  accessCode: string
}): string {
  const link = patientPortalUrl(input.token)
  return [
    `Bună, ${input.fullName}! Sunt kinetoterapeutul tău de la KinetoFlow. Ți-am pregătit planul tău personalizat de exerciții.`,
    `Poți accesa aplicația direct aici: ${link}`,
    `Codul tău unic de acces este: ${input.accessCode}`,
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
