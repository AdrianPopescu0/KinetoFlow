"use server"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import {
  EMAIL_CONFIRM_REQUIRED,
  REGISTER_CONFIRM_INFO,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
} from "@/lib/auth/email-confirmed"
import { redirectAfterTherapistAuth } from "@/lib/auth/redirect-after"
import {
  AUTH_ERROR_MESSAGE,
  parseLoginCredentials,
  parseRegisterCredentials,
  REGISTER_ERROR_MESSAGE,
} from "@/lib/auth/validation"
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

export async function register(formData: FormData): Promise<LoginActionState> {
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
    if (isEmailNotConfirmedAuthError(error)) {
      return { info: REGISTER_CONFIRM_INFO }
    }
    return { error: REGISTER_ERROR_MESSAGE }
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    return { error: "Există deja un cont cu acest email. Intră în cont din tabul de autentificare." }
  }

  // Nu acordăm acces până la confirmarea din email, chiar dacă Supabase a creat o sesiune.
  if (data.session) {
    await supabase.auth.signOut()
  }

  return { info: REGISTER_CONFIRM_INFO }
}
