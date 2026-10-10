/**
 * Clasifică erorile Supabase Auth din callback (exchangeCode / verifyOtp),
 * fără a confunda eșecurile generice cu invitațiile de terapeut.
 */
export function isSupabaseAuthLinkExpiredError(message: string | null | undefined): boolean {
  if (!message) {
    return false
  }
  const normalized = message.toLowerCase()
  if (normalized.includes("otp_expired") || normalized.includes("flow_state_expired")) {
    return true
  }
  if (normalized.includes("email link is invalid or has expired")) {
    return true
  }
  if (normalized.includes("expired") && (normalized.includes("otp") || normalized.includes("link") || normalized.includes("token"))) {
    return true
  }
  return false
}
