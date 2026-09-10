import { normalizeAuthEmail } from "../auth/email-otp.ts"
import { isTherapistInviteOpen } from "./therapist-invite.ts"
import { THERAPIST_INVITE_PATH } from "./therapist-invite-token.ts"

export { readTherapistInviteToken } from "./invite-session.ts"

export const INVITE_NO_EMAIL_ERROR =
  "Google nu a trimis o adresă de email. Folosește un cont Google cu email vizibil sau creează contul cu email și parolă."

export const INVITE_EXPIRED_ERROR =
  "Invitația a expirat sau a fost deja folosită. Cere administratorului clinicii un link nou."

export const INVITE_OTHER_CLINIC_ERROR =
  "Acest email Google aparține deja altei clinici. Folosește altă adresă sau cere ajutorul administratorului."

export type TherapistInviteAttachAction = "attach" | "already_member" | "other_clinic" | "expired" | "no_email"

export type TherapistInviteAttachDecision = {
  action: TherapistInviteAttachAction
  error?: string
}

export function normalizeClinicName(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("ro-RO")
}

export function googleAccountEmail(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  identities?: Array<{
    provider?: string | null
    identity_data?: Record<string, unknown> | null
  }> | null
}): string | null {
  const identities = user.identities ?? []
  const googleIdentity = identities.find((identity) => identity.provider === "google")
  const fromGoogle =
    typeof googleIdentity?.identity_data?.email === "string" ? googleIdentity.identity_data.email : null
  const fromAnyIdentity = identities
    .map((identity) => identity.identity_data?.email)
    .find((value): value is string => typeof value === "string")
  const fromMetadata =
    user.user_metadata && typeof user.user_metadata.email === "string" ? user.user_metadata.email : null
  return (
    normalizeAuthEmail(fromGoogle) ??
    normalizeAuthEmail(user.email) ??
    normalizeAuthEmail(fromMetadata) ??
    normalizeAuthEmail(fromAnyIdentity)
  )
}

export function therapistInvitePagePath(token: string, reason?: string): string {
  const path = `${THERAPIST_INVITE_PATH}/${encodeURIComponent(token)}`
  if (!reason) {
    return path
  }
  return `${path}?reason=${encodeURIComponent(reason)}`
}

export function oauthInviteCallbackUrl(origin: string, token: string): string {
  return `${origin.replace(/\/$/, "")}/auth/callback?invite=${encodeURIComponent(token)}&next=${encodeURIComponent("/dashboard")}`
}

export function therapistInviteReasonMessage(reason: string | undefined): string | null {
  if (reason === "oauth") {
    return "Autentificarea cu Google a fost anulată sau a eșuat. Încearcă din nou."
  }
  if (reason === "no_email") {
    return INVITE_NO_EMAIL_ERROR
  }
  if (reason === "other_clinic") {
    return INVITE_OTHER_CLINIC_ERROR
  }
  if (reason === "expired") {
    return INVITE_EXPIRED_ERROR
  }
  if (reason === "failed") {
    return "Nu am putut asocia invitația cu acest cont Google. Încearcă din nou sau folosește email și parolă."
  }
  return null
}

export type TherapistInviteCandidate = {
  token?: string | null
  email?: string | null
  accepted_user_id?: string | null
  expires_at: string
  accepted_at?: string | null
}

function inviteAcceptedByUser(
  invite: TherapistInviteCandidate | null,
  userId: string | undefined,
): boolean {
  return Boolean(invite && userId && invite.accepted_user_id === userId)
}

/**
 * Tokenul deschis din link bate restul. Un token expirat NU trebuie să
 * ascundă invitația pending cu același email Google — altfel OAuth cade pe
 * onboarding deși adminul a creat deja rândul.
 */
export function pickTherapistInviteCandidate(input: {
  byToken: TherapistInviteCandidate | null
  byEmail: TherapistInviteCandidate | null
  byAcceptedUser: TherapistInviteCandidate | null
  userId?: string
  nowMs?: number
}): TherapistInviteCandidate | null {
  const token = input.byToken
  const email = input.byEmail
  const accepted = input.byAcceptedUser
  const nowMs = input.nowMs

  if (token && (inviteAcceptedByUser(token, input.userId) || isTherapistInviteOpen(token, nowMs))) {
    return token
  }
  if (email && isTherapistInviteOpen(email, nowMs)) {
    return email
  }
  if (accepted) {
    return accepted
  }
  return token ?? email ?? null
}

export function decideTherapistInviteAttach(input: {
  email: string | null
  userId: string
  invite: {
    clinic_name: string
    expires_at: string
    accepted_at?: string | null
    accepted_user_id?: string | null
  } | null
  existingClinicName: string | null
  nowMs?: number
}): TherapistInviteAttachDecision {
  if (!input.invite) {
    if (!input.email) {
      return { action: "no_email", error: INVITE_NO_EMAIL_ERROR }
    }
    return { action: "expired", error: INVITE_EXPIRED_ERROR }
  }

  const acceptedBySelf = input.invite.accepted_user_id === input.userId
  if (!acceptedBySelf && !isTherapistInviteOpen(input.invite, input.nowMs)) {
    return { action: "expired", error: INVITE_EXPIRED_ERROR }
  }

  if (
    input.existingClinicName &&
    normalizeClinicName(input.existingClinicName) !== normalizeClinicName(input.invite.clinic_name)
  ) {
    return { action: "other_clinic", error: INVITE_OTHER_CLINIC_ERROR }
  }

  if (input.existingClinicName) {
    return { action: "already_member" }
  }

  return { action: "attach" }
}
