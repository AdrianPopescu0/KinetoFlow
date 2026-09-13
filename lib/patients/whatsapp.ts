import { CANONICAL_PRODUCTION_ORIGIN, resolveAppOrigin } from "../auth/site-origin.ts"
import { patientInviteShareMessage } from "./invite-message.ts"
import { toWhatsAppNumber } from "./phone.ts"

export {
  isExternalWhatsAppUrl,
  openExternalWhatsApp,
  patientWhatsAppHref,
  patientWhatsAppMeHref,
  patientWhatsAppWebHref,
  WHATSAPP_BLANK_REL,
  WHATSAPP_BLANK_TARGET,
  whatsappBlankAnchorProps,
} from "./whatsapp-links.ts"

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

/** Query `/acces?phone=…&code=…` — telefonul e în cifre internaționale (fără +). */
export function patientAccessLoginQuery(input: {
  phone?: string | null
  accessCode?: string | null
}): string {
  const params = new URLSearchParams()
  const phone = input.phone ? toWhatsAppNumber(input.phone) : null
  const code = (input.accessCode ?? "").replace(/\D/g, "").slice(0, 8)
  if (phone) {
    params.set("phone", phone)
  }
  if (code) {
    params.set("code", code)
  }
  const query = params.toString()
  return query ? `?${query}` : ""
}

/** Link de acces cu telefon și/sau cod, pentru WhatsApp, SMS și reminder. */
export function patientAccessLoginUrl(input: {
  phone?: string | null
  accessCode?: string | null
} = {}): string {
  return `${patientAccessUrl()}${patientAccessLoginQuery(input)}`
}

/** @deprecated Folosește patientAccessLoginUrl — păstrat pentru reminder-e vechi. */
export function patientAccessUrlWithCode(accessCode: string, phone?: string | null): string {
  return patientAccessLoginUrl({ accessCode, phone })
}

export function patientWhatsAppMessage(input: {
  fullName: string
  clinicName: string
  accessCode: string
  phone?: string | null
}): string {
  return patientInviteShareMessage({
    fullName: input.fullName,
    accessCode: input.accessCode,
    accessUrl: patientAccessLoginUrl({
      phone: input.phone,
      accessCode: input.accessCode,
    }),
  })
}

/** Reminder zilnic: check-in lipsă, cu link precompletat pe codul de 8 cifre. */
export function patientCheckinReminderMessage(input: {
  fullName: string
  clinicName: string
  accessCode: string
  phone?: string | null
}): string {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName
  return [
    `Bună, ${firstName}! Reminder de la ${input.clinicName}: nu ai făcut încă check-in-ul de azi.`,
    "Intră aici și notează cum te simți înainte de exerciții:",
    `👉 ${patientAccessLoginUrl({ accessCode: input.accessCode, phone: input.phone })}`,
    "",
    `(Codul tău de acces este ${input.accessCode} și s-a completat automat).`,
    "Spor la recuperare!",
  ].join("\n")
}
