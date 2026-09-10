import { evaluateRegisterPassword, REGISTER_PASSWORD_HINT } from "./password.ts"

const LEGAL_ACCEPT_FIELD = "legal_accept"

export const INVITE_LEGAL_ACCEPT_ERROR =
  "Pentru a crea contul trebuie să accepți Termenii și Condițiile și Politica de Confidențialitate."

/**
 * Invitația de terapeut nu cere OTP. Emailul vine din rândul invitației,
 * nu din formular — parola e singurul câmp pe care îl alege terapeutul.
 */
export function parseInviteActivation(formData: FormData): { password: string } | { error: string } {
  const passwordRaw = formData.get("password")
  if (typeof passwordRaw !== "string") {
    return { error: REGISTER_PASSWORD_HINT }
  }
  if (!evaluateRegisterPassword(passwordRaw).isValid) {
    return { error: REGISTER_PASSWORD_HINT }
  }
  if (formData.get(LEGAL_ACCEPT_FIELD) !== "on") {
    return { error: INVITE_LEGAL_ACCEPT_ERROR }
  }
  return { password: passwordRaw }
}

export function inviteAcceptGoesToDashboard(
  result: { next?: string; error?: string } | null | undefined,
): boolean {
  return Boolean(result && result.next === "/dashboard" && !result.error)
}
