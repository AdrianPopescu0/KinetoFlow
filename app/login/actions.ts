"use server"

import { redirect } from "next/navigation"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { redirectAfterTherapistAuth } from "@/lib/auth/redirect-after"
import { AUTH_ERROR_MESSAGE, parseLoginCredentials } from "@/lib/auth/validation"
import { createClient } from "@/utils/supabase/server"

export type LoginActionState = {
  error: string
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

export async function signInWithGoogle(): Promise<LoginActionState> {
  const supabase = await createClient()
  const origin = await appOrigin()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: oauthCallbackUrl(origin, "/onboarding"),
    },
  })

  if (error || !data.url) {
    return { error: "Nu am putut deschide autentificarea Google. Activează providerul Google în Supabase Auth." }
  }

  redirect(data.url)
}
