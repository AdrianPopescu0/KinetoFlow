"use server"

import { cookies } from "next/headers"

import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import {
  EMAIL_CONFIRM_REQUIRED,
  isEmailAlreadyRegisteredError,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
} from "@/lib/auth/email-confirmed"
import { consumeAuthEmailOtp, issueAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import { SIGNED_OUT_GATE_COOKIE, therapistClientSessionFrom } from "@/lib/auth/oauth-redirect"
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
  accessToken?: string
  refreshToken?: string
} | null

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră în cont din tabul de autentificare."

async function therapistAuthSuccess(supabase: Awaited<ReturnType<typeof createClient>>): Promise<NonNullable<LoginActionState>> {
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

const OTP_SENT_INFO =
  "Ți-am trimis un cod de 6 cifre pe email. Introdu-l în aplicație pe același dispozitiv de pe care ai început. Este valabil 10 minute."

async function requireRegistrationOtp(email: string, formData: FormData): Promise<string | null> {
  const code = String(formData.get("otp") ?? "")
  const verified = await consumeAuthEmailOtp({ email, code })
  if (!verified.ok) {
    return verified.error
  }
  return null
}

export async function requestAuthEmailOtpAction(formData: FormData): Promise<LoginActionState> {
  if (formData.get("purpose") !== "register") {
    return { error: "Codul de 6 cifre se trimite doar la crearea contului. Intră cu email și parolă." }
  }

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

export async function login(formData: FormData): Promise<LoginActionState> {
  const credentials = parseLoginCredentials(formData)

  if (!credentials) {
    return { error: AUTH_ERROR_MESSAGE }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  })

  if (error) {
    if (isEmailNotConfirmedAuthError(error)) {
      return { info: EMAIL_CONFIRM_REQUIRED }
    }
    return { error: AUTH_ERROR_MESSAGE }
  }

  const user = data.user ?? data.session?.user ?? null
  if (!isEmailConfirmedUser(user)) {
    await supabase.auth.signOut()
    return { info: EMAIL_CONFIRM_REQUIRED }
  }

  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  jar.delete(VERIFIED_OTP_COOKIE)
  const tokens = therapistClientSessionFrom(data.session)
  return {
    next: await resolveTherapistAppPath(),
    ...(tokens
      ? { accessToken: tokens.access_token, refreshToken: tokens.refresh_token }
      : {}),
  }
}

export async function register(formData: FormData): Promise<LoginActionState> {
  const parsed = parseRegisterCredentials(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const otpError = await requireRegistrationOtp(parsed.email, formData)
  if (otpError) {
    return { error: otpError }
  }

  const code = String(formData.get("otp") ?? "")
  const verified = await verifySignupEmailOtp(parsed.email, code)
  if (verified.ok) {
    const jar = await cookies()
    jar.delete(SIGNED_OUT_GATE_COOKIE)
    jar.delete(VERIFIED_OTP_COOKIE)
    const supabase = await createClient()
    return therapistAuthSuccess(supabase)
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
    return verifiedSignInFailureMessage(signedIn, REGISTER_ERROR_MESSAGE)
  }

  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  return therapistAuthSuccess(supabase)
}
