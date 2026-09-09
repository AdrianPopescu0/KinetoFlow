"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import {
  EMAIL_CONFIRM_REQUIRED,
  isEmailConfirmedUser,
  isEmailNotConfirmedAuthError,
} from "@/lib/auth/email-confirmed"
import {
  EARLY_ACCESS_COOKIE,
  EARLY_ACCESS_TTL_MS,
  isValidEarlyAccessCode,
  signEarlyAccessCookie,
} from "@/lib/auth/early-access"
import { EMAIL_OTP_TTL_MS, readVerifiedEmailCookie, signVerifiedEmailCookie } from "@/lib/auth/email-otp"
import { consumeAuthEmailOtp, issueAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import { appOrigin, oauthCallbackUrl } from "@/lib/auth/origin"
import { redirectAfterTherapistAuth } from "@/lib/auth/redirect-after"
import {
  AUTH_ERROR_MESSAGE,
  parseLoginCredentials,
  parseRecoveryEmail,
  parseRegisterCredentials,
  REGISTER_ERROR_MESSAGE,
} from "@/lib/auth/validation"
import { createServiceRoleClient } from "@/utils/supabase/admin"
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
} | null

export async function unlockEarlyAccess(formData: FormData): Promise<EarlyAccessState> {
  const code = formData.get("code")
  if (!isValidEarlyAccessCode(code)) {
    return { error: "Codul nu este valid. Introdu cele 12 caractere primite pentru Early Access." }
  }

  const jar = await cookies()
  jar.set(EARLY_ACCESS_COOKIE, await signEarlyAccessCookie(Date.now() + EARLY_ACCESS_TTL_MS), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(EARLY_ACCESS_TTL_MS / 1000),
  })

  redirect("/login")
}

export async function requestEarlyAccessEmailOtp(formData: FormData): Promise<EarlyAccessEmailState> {
  const email = parseRecoveryEmail(formData)
  if (!email) {
    return { error: "Introdu o adresă de email validă." }
  }

  const issued = await issueAuthEmailOtp({ email, purpose: "login" })
  if (!issued.ok) {
    return { error: issued.error }
  }

  return {
    email,
    otpSent: true,
    info: "Ți-am trimis un cod de 6 cifre și un link pe acest email. Este valabil 10 minute.",
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

  const otpError = await assertVerifiedEmail(credentials.email, formData)
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

  await clearVerifiedEmailCookie()
  await redirectAfterTherapistAuth()
  return null
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

  if (error) {
    if (isEmailNotConfirmedAuthError(error)) {
      return { error: REGISTER_ERROR_MESSAGE }
    }
    return { error: REGISTER_ERROR_MESSAGE }
  }

  if (data.user?.identities && data.user.identities.length === 0) {
    return { error: "Există deja un cont cu acest email. Alege „Am deja cont” și introdu parola." }
  }

  if (data.user?.id) {
    try {
      const admin = createServiceRoleClient()
      await admin.auth.admin.updateUserById(data.user.id, { email_confirm: true })
    } catch {
      // Dacă confirmarea admin eșuează, încercăm totuși autentificarea cu parola.
    }
  }

  if (data.session) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (isEmailConfirmedUser(user)) {
      await clearVerifiedEmailCookie()
      await redirectAfterTherapistAuth()
      return null
    }
    await supabase.auth.signOut()
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  })

  if (signInError) {
    if (isEmailNotConfirmedAuthError(signInError)) {
      return { info: EMAIL_CONFIRM_REQUIRED }
    }
    return { error: REGISTER_ERROR_MESSAGE }
  }

  await clearVerifiedEmailCookie()
  await redirectAfterTherapistAuth()
  return null
}
