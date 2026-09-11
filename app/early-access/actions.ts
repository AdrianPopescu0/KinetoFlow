"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  EMAIL_CONFIRM_REQUIRED,
  isEmailAlreadyRegisteredError,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
} from "@/lib/auth/email-confirmed"
import { isValidEarlyAccessCode } from "@/lib/auth/early-access"
import { EMAIL_OTP_TTL_MS, readVerifiedEmailCookie, signVerifiedEmailCookie } from "@/lib/auth/email-otp"
import { consumeAuthEmailOtp, issueAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { resolveTherapistAppPath } from "@/lib/auth/redirect-after"
import {
  AUTH_ERROR_MESSAGE,
  parseLoginCredentials,
  parseRecoveryEmail,
  parseRegisterCredentials,
  REGISTER_ERROR_MESSAGE,
} from "@/lib/auth/validation"
import {
  signInAfterEmailVerified,
  verifiedSignInFailureMessage,
} from "@/lib/auth/verified-password-session"
import { createClient } from "@/utils/supabase/server"

export type EarlyAccessState = {
  error?: string
}

export type EarlyAccessEmailState = {
  error?: string
  info?: string
  email?: string
  otpSent?: boolean
  verified?: boolean
  devCode?: string
  next?: "/dashboard" | "/onboarding"
} | null

export async function unlockEarlyAccess(
  _prevState: EarlyAccessState,
  formData: FormData,
): Promise<EarlyAccessState> {
  const code = formData.get("code")
  if (!isValidEarlyAccessCode(code)) {
    return { error: "Codul nu este valid. Introdu cele 12 caractere primite pentru Early Access." }
  }

  const cookieStore = await cookies()
  cookieStore.set("early_access_verified", "1", {
    path: "/",
    maxAge: 90 * 24 * 60 * 60,
  })

  redirect("/login")
}

export async function requestEarlyAccessEmailOtp(formData: FormData): Promise<EarlyAccessEmailState> {
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
    email: parsed.email,
    otpSent: true,
    info: "Ți-am trimis un cod de 6 cifre pe acest email. Este valabil 10 minute. Introdu-l în aplicație — emailul nu te autentifică automat.",
    devCode: issued.devCode,
  }
}

export async function verifyEarlyAccessEmailOtp(formData: FormData): Promise<EarlyAccessEmailState> {
  const email = parseRecoveryEmail(formData)
  if (!email) {
    return { error: "Introdu o adresă de email validă." }
  }

  const code = String(formData.get("otp") ?? "")
  const verified = await consumeAuthEmailOtp({ email, code })
  if (!verified.ok) {
    return { error: verified.error }
  }

  const jar = await cookies()
  jar.set(VERIFIED_OTP_COOKIE, signVerifiedEmailCookie(verified.email, Date.now() + EMAIL_OTP_TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(EMAIL_OTP_TTL_MS / 1000),
  })

  return {
    email: verified.email,
    verified: true,
    info: "Adresa a fost confirmată. Continuă cu parola ca să intri sau să creezi contul.",
  }
}

async function assertVerifiedEmail(email: string, formData: FormData): Promise<string | null> {
  const jar = await cookies()
  const fromCookie = readVerifiedEmailCookie(jar.get(VERIFIED_OTP_COOKIE)?.value)
  if (fromCookie && fromCookie === email) {
    return null
  }

  const code = String(formData.get("otp") ?? "")
  const verified = await consumeAuthEmailOtp({ email, code })
  if (!verified.ok) {
    return verified.error
  }
  return null
}

async function clearVerifiedEmailCookie() {
  const jar = await cookies()
  jar.delete(VERIFIED_OTP_COOKIE)
}

export async function finishEarlyAccessLogin(formData: FormData): Promise<EarlyAccessEmailState> {
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

  await clearVerifiedEmailCookie()
  return { next: await resolveTherapistAppPath() }
}

export async function finishEarlyAccessRegister(formData: FormData): Promise<EarlyAccessEmailState> {
  const parsed = parseRegisterCredentials(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const otpError = await assertVerifiedEmail(parsed.email, formData)
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

  const duplicateIdentity = Boolean(data.user?.identities && data.user.identities.length === 0)
  if (error && !isEmailAlreadyRegisteredError(error) && !duplicateIdentity) {
    return { error: REGISTER_ERROR_MESSAGE }
  }

  if (duplicateIdentity || isEmailAlreadyRegisteredError(error)) {
    const signedIn = await signInAfterEmailVerified({
      email: parsed.email,
      password: parsed.password,
      emailJustVerified: true,
    })
    if (signedIn.ok) {
      await clearVerifiedEmailCookie()
      return { next: await resolveTherapistAppPath() }
    }
    return { error: "Există deja un cont cu acest email. Alege „Am deja cont” și introdu parola." }
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

  await clearVerifiedEmailCookie()
  return { next: await resolveTherapistAppPath() }
}
