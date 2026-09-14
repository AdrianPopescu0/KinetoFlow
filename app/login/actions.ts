"use server"

import { cookies } from "next/headers"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { isEmailAlreadyRegisteredError } from "@/lib/auth/email-confirmed"
import { SIGNED_OUT_GATE_COOKIE, therapistClientSessionFrom } from "@/lib/auth/oauth-redirect"
import { resolveTherapistAppPath } from "@/lib/auth/redirect-after"
import {
  AUTH_ERROR_MESSAGE,
  parseLoginCredentials,
  parseRegisterCredentials,
  REGISTER_ERROR_MESSAGE,
} from "@/lib/auth/validation"
import {
  signInAfterEmailVerified,
  verifiedSignInFailureMessage,
} from "@/lib/auth/verified-password-session"
import { createClient } from "@/utils/supabase/server"

export type LoginActionState = {
  error?: string
  info?: string
  next?: "/dashboard" | "/onboarding"
  accessToken?: string
  refreshToken?: string
} | null

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră în cont din tabul de autentificare."

async function therapistAuthSuccess(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<NonNullable<LoginActionState>> {
  const next = await resolveTherapistAppPath()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const tokens = therapistClientSessionFrom(session)
  return {
    next,
    ...(tokens
      ? { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
      : {}),
  }
}

export async function login(formData: FormData): Promise<LoginActionState> {
  const credentials = parseLoginCredentials(formData)

  if (!credentials) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  // Fără OTP / confirmare pe email — autentificare directă cu email + parolă.
  const signedIn = await signInAfterEmailVerified({
    email: credentials.email,
    password: credentials.password,
    emailJustVerified: true,
  })
  if (!signedIn.ok) {
    const failure = verifiedSignInFailureMessage(signedIn, AUTH_ERROR_MESSAGE)
    return { error: failure.error ?? AUTH_ERROR_MESSAGE }
  }

  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  const supabase = await createClient()
  return therapistAuthSuccess(supabase)
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

  const duplicateIdentity = Boolean(data.user?.identities && data.user.identities.length === 0)
  if (error && !isEmailAlreadyRegisteredError(error) && !duplicateIdentity) {
    return { error: REGISTER_ERROR_MESSAGE }
  }

  if (duplicateIdentity || isEmailAlreadyRegisteredError(error)) {
    const signedInExisting = await signInAfterEmailVerified({
      email: parsed.email,
      password: parsed.password,
      emailJustVerified: true,
    })
    if (signedInExisting.ok) {
      const jar = await cookies()
      jar.delete(SIGNED_OUT_GATE_COOKIE)
      return therapistAuthSuccess(supabase)
    }
    return { error: EXISTING_ACCOUNT_MESSAGE }
  }

  const signedIn = await signInAfterEmailVerified({
    email: parsed.email,
    password: parsed.password,
    userId: data.user?.id ?? null,
    emailJustVerified: true,
  })
  if (!signedIn.ok) {
    const failure = verifiedSignInFailureMessage(signedIn, REGISTER_ERROR_MESSAGE)
    return { error: failure.error ?? REGISTER_ERROR_MESSAGE }
  }

  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  return therapistAuthSuccess(supabase)
}
