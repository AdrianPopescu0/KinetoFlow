import { CANONICAL_PRODUCTION_ORIGIN, resolveAppOrigin } from "@/lib/auth/site-origin"

export {
  isExternalWhatsAppUrl,
  openExternalWhatsApp,
  patientWhatsAppHref,
  patientWhatsAppWebHref,
  WHATSAPP_BLANK_REL,
  WHATSAPP_BLANK_TARGET,
  whatsappBlankAnchorProps,
} from "@/lib/patients/whatsapp-links"

export function publicSiteUrl(): string {
  return resolveAppOrigin({
    envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
}

/** Pagina de acces pacient (`/acces`) pe domeniul public configurat. */
export function patientAccessUrl(): string {
  return `${publicSiteUrl()}/acces`
}

/** @deprecated Folosește patientAccessUrl() — păstrat pentru importuri existente. */
export const PATIENT_ACCESS_PAGE_URL = `${CANONICAL_PRODUCTION_ORIGIN}/acces`

export function patientPortalUrl(token: string): string {
  return `${publicSiteUrl()}/patient/${token}`
}

/** Link de acces cu codul de 8 cifre precompletat. */
export function patientAccessUrlWithCode(accessCode: string): string {
  const code = accessCode.trim()
  const base = patientAccessUrl()
  return code ? `${base}?code=${encodeURIComponent(code)}` : base
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

/** Reminder zilnic: check-in lipsă, cu link precompletat pe codul de 8 cifre. */
export function patientCheckinReminderMessage(input: {
  fullName: string
  clinicName: string
  accessCode: string
}): string {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName
  return [
    `Bună, ${firstName}! Reminder de la ${input.clinicName}: nu ai făcut încă check-in-ul de azi.`,
    "Intră aici și notează cum te simți înainte de exerciții:",
    `👉 ${patientAccessUrlWithCode(input.accessCode)}`,
    "",
    `(Codul tău de acces este ${input.accessCode} și s-a completat automat).`,
    "Spor la recuperare!",
  ].join("\n")
}
