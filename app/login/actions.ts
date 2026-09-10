"use server"

import { cookies } from "next/headers"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { isEmailAlreadyRegisteredError } from "@/lib/auth/email-confirmed"
import { readVerifiedEmailCookie } from "@/lib/auth/email-otp"
import { consumeAuthEmailOtp, issueAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { emailOtpPageHref } from "@/lib/auth/paths"
import { resolveTherapistAppPath } from "@/lib/auth/redirect-after"
import {
  AUTH_ERROR_MESSAGE,
  parseLoginCredentials,
  parseRegisterCredentials,
  REGISTER_ERROR_MESSAGE,
} from "@/lib/auth/validation"
import { verifySignupEmailOtp } from "@/lib/auth/verify-signup-otp"
import {
  signInAfterEmailVerified,
  verifiedSignInFailureMessage,
} from "@/lib/auth/verified-password-session"
import { createClient } from "@/utils/supabase/server"

export type LoginActionState = {
  error?: string
  info?: string
  otpSent?: boolean
  devCode?: string
  continuePath?: string
  next?: "/dashboard" | "/onboarding"
} | null

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră în cont din tabul de autentificare."

const OTP_SENT_INFO =
  "Ți-am trimis un cod de 6 cifre pe email. Introdu-l în aplicație pe același dispozitiv de pe care ai început. Este valabil 10 minute."

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
    const issued = await issueAuthEmailOtp({
      email: parsed.email,
      purpose: "register",
      password: parsed.password,
    })
    if (!issued.ok) {
      return { error: issued.error }
    }
    return {
      otpSent: true,
      info: OTP_SENT_INFO,
      devCode: issued.devCode,
      continuePath: emailOtpPageHref(parsed.email, "register"),
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
    info: OTP_SENT_INFO,
    devCode: issued.devCode,
    continuePath: emailOtpPageHref(credentials.email, "login"),
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

  const signedIn = await signInAfterEmailVerified({
    email: credentials.email,
    password: credentials.password,
    emailJustVerified: true,
  })
  if (!signedIn.ok) {
    return verifiedSignInFailureMessage(signedIn, AUTH_ERROR_MESSAGE)
  }

  return { next: await resolveTherapistAppPath() }
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

  const code = String(formData.get("otp") ?? "")
  const verified = await verifySignupEmailOtp(parsed.email, code)
  if (verified.ok) {
    const jar = await cookies()
    jar.delete(SIGNED_OUT_GATE_COOKIE)
    jar.delete(VERIFIED_OTP_COOKIE)
    return { next: await resolveTherapistAppPath() }
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
      return { next: await resolveTherapistAppPath() }
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
    return verifiedSignInFailureMessage(signedIn, REGISTER_ERROR_MESSAGE)
  }

  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  return { next: await resolveTherapistAppPath() }
}
