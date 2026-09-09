"use server"

import { cookies } from "next/headers"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import {
  EMAIL_CONFIRM_REQUIRED,
  REGISTER_CONFIRM_INFO,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
} from "@/lib/auth/email-confirmed"
import { readVerifiedEmailCookie } from "@/lib/auth/email-otp"
import { consumeAuthEmailOtp, issueAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
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
  otpSent?: boolean
  devCode?: string
} | null

async function requireEmailOtp(email: string, formData: FormData): Promise<string | null> {
  const jar = await cookies()
  const fromCookie = readVerifiedEmailCookie(jar.get(VERIFIED_OTP_COOKIE)?.value)
  if (fromCookie && fromCookie === email) {
    jar.delete(VERIFIED_OTP_COOKIE)
    return null
  }

  const code = String(formData.get("otp") ?? "")
  const verified = await consumeAuthEmailOtp({ email, code })
  if (!verified.ok) {
    return verified.error
  }
  return null
}

export async function requestAuthEmailOtpAction(formData: FormData): Promise<LoginActionState> {
  const purpose = formData.get("purpose") === "register" ? "register" : "login"

  if (purpose === "register") {
    const parsed = parseRegisterCredentials(formData)
    if ("error" in parsed) {
      return { error: parsed.error }
    }
    const issued = await issueAuthEmailOtp({ email: parsed.email, purpose: "register" })
    if (!issued.ok) {
      return { error: issued.error }
    }
    return {
      otpSent: true,
      info: "Ți-am trimis un cod de acces pe email. Este valabil 10 minute.",
      devCode: issued.devCode,
    }
  }

  const credentials = parseLoginCredentials(formData)
  if (!credentials) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  const issued = await issueAuthEmailOtp({ email: credentials.email, purpose: "login" })
  if (!issued.ok) {
    return { error: issued.error }
  }
  return {
    otpSent: true,
    info: "Ți-am trimis un cod de acces pe email. Este valabil 10 minute.",
    devCode: issued.devCode,
  }
}

export async function login(formData: FormData): Promise<LoginActionState> {
  const credentials = parseLoginCredentials(formData)

  if (!credentials) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  const otpError = await requireEmailOtp(credentials.email, formData)
  if (otpError) {
    return { error: otpError }
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

  const otpError = await requireEmailOtp(parsed.email, formData)
  if (otpError) {
    return { error: otpError }
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
