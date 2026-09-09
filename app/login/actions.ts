"use server"

import {
  EMAIL_CONFIRM_REQUIRED,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
} from "@/lib/auth/email-confirmed"
import { redirectAfterTherapistAuth } from "@/lib/auth/redirect-after"
import { AUTH_ERROR_MESSAGE, parseLoginCredentials } from "@/lib/auth/validation"
import { createClient } from "@/utils/supabase/server"

export type LoginActionState = {
  error?: string
  info?: string
} | null

export async function login(formData: FormData): Promise<LoginActionState> {
  const credentials = parseLoginCredentials(formData)

  if (!credentials) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    if (isEmailNotConfirmedAuthError(error)) {
      return { info: EMAIL_CONFIRM_REQUIRED }
    }
    return { error: AUTH_ERROR_MESSAGE }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!isEmailConfirmedUser(user)) {
    await supabase.auth.signOut()
    return { info: EMAIL_CONFIRM_REQUIRED }
  }

  await redirectAfterTherapistAuth()
  return null
}

export async function register(_formData: FormData): Promise<LoginActionState> {
  return { error: "Înregistrarea de clinici noi nu este disponibilă. Autentifică-te dacă ai deja cont." }
}
