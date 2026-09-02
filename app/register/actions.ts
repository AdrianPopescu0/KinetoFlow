"use server"

import { redirectAfterTherapistAuth } from "@/lib/auth/redirect-after"
import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { parseRegisterCredentials, REGISTER_ERROR_MESSAGE } from "@/lib/auth/validation"
import { createClient } from "@/utils/supabase/server"

export type RegisterActionState = {
  error?: string
  info?: string
} | null

export async function register(formData: FormData): Promise<RegisterActionState> {
  const parsed = parseRegisterCredentials(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const supabase = await createClient()
  const origin = await appOrigin()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.email,
    password: parsed.password,
    options: {
      emailRedirectTo: oauthCallbackUrl(origin, "/onboarding"),
    },
  })

  if (error) {
    return { error: REGISTER_ERROR_MESSAGE }
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    return { error: "Există deja un cont cu acest email. Autentifică-te sau continuă cu Google." }
  }

  if (data.session) {
    await redirectAfterTherapistAuth()
    return null
  }

  return {
    info: "Ți-am trimis un email de confirmare. După ce confirmi, te aducem la configurarea clinicii.",
  }
}
