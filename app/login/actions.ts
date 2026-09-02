"use server"

import { redirect } from "next/navigation"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
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
    return { error: AUTH_ERROR_MESSAGE }
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
    return { error: REGISTER_ERROR_MESSAGE }
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    return { error: "Există deja un cont cu acest email. Intră în cont din tabul de autentificare." }
  }

  if (!data.session) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    })
    if (signInError) {
      return {
        info: "Contul a fost creat. Confirmă emailul, apoi revino la Intră în cont pentru a configura clinica.",
      }
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      info: "Contul a fost creat. Confirmă emailul, apoi revino la Intră în cont pentru a configura clinica.",
    }
  }

  redirect("/onboarding")
}
