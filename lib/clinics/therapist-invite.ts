import { randomBytes } from "node:crypto"

export const THERAPIST_INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000
export const THERAPIST_INVITE_PATH = "/auth/invitatie"
export const MISSING_THERAPIST_INVITES_TABLE =
  "Tabela pentru invitații lipsește. Rulează sql/027_therapist_invites.sql în Supabase SQL Editor."

export function generateTherapistInviteToken(): string {
  return randomBytes(24).toString("base64url")
}

export function isTherapistInviteToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,80}$/.test(value.trim())
}

export function therapistInviteUrl(siteUrl: string, token: string): string {
  const origin = siteUrl.replace(/\/$/, "")
  return `${origin}${THERAPIST_INVITE_PATH}/${encodeURIComponent(token)}`
}

export function isTherapistInviteOpen(
  invite: { accepted_at?: string | null; expires_at: string },
  nowMs = Date.now(),
): boolean {
  if (invite.accepted_at) {
    return false
  }
  return new Date(invite.expires_at).getTime() > nowMs
}

export function isMissingTherapistInvitesTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("therapist_invites") &&
      (message.includes("does not exist") || message.includes("schema cache") || message.includes("could not find")))
  )
}
