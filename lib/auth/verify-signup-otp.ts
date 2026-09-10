import "server-only"

import type { EmailOtpType } from "@supabase/supabase-js"

import { isEmailOtpCode, normalizeAuthEmail } from "@/lib/auth/email-otp"
import { createClient } from "@/utils/supabase/server"

const SIGNUP_OTP_TYPES: EmailOtpType[] = ["signup", "email", "magiclink", "invite", "recovery"]

export type VerifySignupOtpResult =
  | { ok: true }
  | { ok: false; error: string }

/**
 * Confirmă contul pe dispozitivul curent cu codul de 6 cifre (Supabase Auth verifyOtp).
 * Nu folosește token_hash din link — astfel deschiderea emailului pe alt dispozitiv
 * nu mută sesiunea acolo.
 */
export async function verifySignupEmailOtp(emailRaw: string, codeRaw: string): Promise<VerifySignupOtpResult> {
  const email = normalizeAuthEmail(emailRaw)
  const token = codeRaw.trim()
  if (!email || !isEmailOtpCode(token)) {
    return { ok: false, error: "Introdu codul de 6 cifre primit pe email." }
  }

  const supabase = await createClient()
  let lastError = "Cod invalid sau expirat."

  for (const type of SIGNUP_OTP_TYPES) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type,
    })
    if (!error && (data.session || data.user)) {
      return { ok: true }
    }
    if (error?.message) {
      lastError = error.message
    }
  }

  const message = lastError.toLowerCase()
  if (message.includes("expired")) {
    return { ok: false, error: "Codul a expirat. Cere un cod nou din aplicație." }
  }
  if (message.includes("invalid") || message.includes("otp")) {
    return { ok: false, error: "Cod invalid sau expirat." }
  }
  return { ok: false, error: lastError }
}
