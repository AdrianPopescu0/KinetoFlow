"use server"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { parseRecoveryEmail } from "@/lib/auth/validation"
import { createClient } from "@/utils/supabase/server"

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
  const origin = await appOrigin()

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: oauthCallbackUrl(origin, "/dashboard"),
  })

  return {
    message: RECOVERY_NOTICE,
    error: null,
  }
}
