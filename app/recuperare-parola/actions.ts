"use server"

import { parseRecoveryEmail } from "@/lib/auth/validation"
import { createClient } from "@/lib/supabase/server"

const RECOVERY_NOTICE =
  "Dacă există un cont asociat acestei adrese, vei primi un email cu instrucțiuni de resetare."

export type RecoveryActionState = {
  message: string
  error: string | null
}

export async function requestPasswordReset(
  formData: FormData,
): Promise<RecoveryActionState> {
  const email = parseRecoveryEmail(formData)

  if (!email) {
    return {
      message: "",
      error: "Introdu o adresă de email validă.",
    }
  }

  const supabase = await createClient()
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:43123"

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/dashboard`,
  })

  return {
    message: RECOVERY_NOTICE,
    error: null,
  }
}
