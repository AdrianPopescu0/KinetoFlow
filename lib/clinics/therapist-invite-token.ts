export const THERAPIST_INVITE_PATH = "/auth/invitatie"

export function isTherapistInviteToken(value: string): boolean {
  return /^[A-Za-z0-9_-]{20,80}$/.test(value.trim())
}
