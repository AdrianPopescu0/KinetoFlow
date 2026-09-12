/** Destinația după Google: clinică existentă, invitație sau crearea clinicii. */
export function postGoogleAuthDestination(input: {
  attached: boolean
  clinicReady: boolean
  inviteToken?: string | null
}): "/dashboard" | "/onboarding" | string {
  if (input.attached || input.clinicReady) {
    return "/dashboard"
  }
  const token = typeof input.inviteToken === "string" ? input.inviteToken.trim() : ""
  if (token) {
    return `/auth/invitatie/finalize?invite=${encodeURIComponent(token)}`
  }
  return "/onboarding"
}
