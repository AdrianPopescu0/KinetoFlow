"use server"

import { cookies, headers } from "next/headers"

import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { consumeAuthEmailOtp, issueAuthEmailOtp, VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import { parseRegisterCredentials } from "@/lib/auth/validation"
import { verifySignupEmailOtp } from "@/lib/auth/verify-signup-otp"
import {
  signInAfterEmailVerified,
  verifiedSignInFailureMessage,
} from "@/lib/auth/verified-password-session"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import {
  THERAPIST_INVITE_CLIENT_COOKIE,
  THERAPIST_INVITE_COOKIE,
  THERAPIST_INVITE_PATH,
  inviteTokenFromFormData,
  inviteTokenFromHref,
  readTherapistInviteToken,
  writeTherapistInviteCookies,
} from "@/lib/clinics/invite-session"
import {
  isMissingTherapistInvitesTable,
  isTherapistInviteOpen,
  isTherapistInviteToken,
  MISSING_THERAPIST_INVITES_TABLE,
} from "@/lib/clinics/therapist-invite"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

export type AcceptTherapistInviteState = {
  error?: string
  info?: string
  otpSent?: boolean
  devCode?: string
  next?: "/dashboard"
} | null

const OTP_SENT_INFO =
  "Ți-am trimis un cod de 6 cifre pe email. Introdu-l aici, pe același dispozitiv. Este valabil 10 minute."

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră cu aceeași parolă sau continuă cu Google."

async function assertOpenInvite(token: string): Promise<string | null> {
  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from("therapist_invites")
      .select("id, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle()

    if (error) {
      if (isMissingTherapistInvitesTable(error)) {
        return MISSING_THERAPIST_INVITES_TABLE
      }
      return formatSupabaseError(error)
    }

    if (!data || !isTherapistInviteOpen(data)) {
      return "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou."
    }

    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut verifica invitația."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local."
    }
    return message
  }
}

async function resolveInviteTokenFromSubmit(tokenFromUrl: string, formData: FormData): Promise<string | null> {
  const jar = await cookies()
  const headerList = await headers()
  return readTherapistInviteToken(
    tokenFromUrl,
    inviteTokenFromFormData(formData),
    inviteTokenFromHref(headerList.get("referer")),
    inviteTokenFromHref(headerList.get("referrer")),
    inviteTokenFromHref(headerList.get("next-url")),
    inviteTokenFromHref(headerList.get("x-url")),
    inviteTokenFromHref(headerList.get("x-next-url")),
    jar.get(THERAPIST_INVITE_COOKIE)?.value,
    jar.get(THERAPIST_INVITE_CLIENT_COOKIE)?.value,
  )
}

async function attachInviteAndEnterDashboard(input: {
  token: string
  userId: string
  email: string
}): Promise<AcceptTherapistInviteState> {
  const attached = await attachTherapistInviteToUser({
    token: input.token,
    user: { id: input.userId, email: input.email },
  })
  if (!attached.ok) {
    const supabase = await createClient()
    await supabase.auth.signOut()
    return { error: attached.error }
  }

  const supabase = await createClient()
  await supabase.auth.refreshSession()
  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  jar.delete(VERIFIED_OTP_COOKIE)
  writeTherapistInviteCookies((name, value, options) => jar.set(name, value, options), input.token)
  return { next: "/dashboard" }
}

export async function prepareTherapistInviteOAuth(token: string): Promise<AcceptTherapistInviteState> {
  if (!isTherapistInviteToken(token)) {
    return { error: "Linkul de invitație este invalid." }
  }

  const inviteError = await assertOpenInvite(token)
  if (inviteError) {
    return { error: inviteError }
  }

  const jar = await cookies()
  writeTherapistInviteCookies((name, value, options) => jar.set(name, value, options), token)
  return null
}

export async function requestInviteRegisterOtp(
  tokenFromUrl: string,
  formData: FormData,
): Promise<AcceptTherapistInviteState> {
  const token = await resolveInviteTokenFromSubmit(tokenFromUrl, formData)
  if (!token) {
    return { error: "Linkul de invitație este invalid. Reîncarcă pagina din mesajul primit." }
  }

  const parsed = parseRegisterCredentials(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const inviteError = await assertOpenInvite(token)
  if (inviteError) {
    return { error: inviteError }
  }

  const supabase = await createClient()
  await supabase.auth.signOut()

  const issued = await issueAuthEmailOtp({
    email: parsed.email,
    purpose: "register",
    password: parsed.password,
    returnPath: `${THERAPIST_INVITE_PATH}/${token}`,
  })

  if (issued.ok) {
    const jar = await cookies()
    writeTherapistInviteCookies((name, value, options) => jar.set(name, value, options), token)
    return {
      otpSent: true,
      info: OTP_SENT_INFO,
      devCode: issued.devCode,
    }
  }

  if (issued.status === 409) {
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    })
    if (signInError) {
      return { error: EXISTING_ACCOUNT_MESSAGE }
    }
    const user = data.user ?? data.session?.user
    if (!user?.id) {
      return { error: EXISTING_ACCOUNT_MESSAGE }
    }
    return attachInviteAndEnterDashboard({
      token,
      userId: user.id,
      email: parsed.email,
    })
  }

  return { error: issued.error }
}

export async function confirmInviteRegisterOtp(
  tokenFromUrl: string,
  formData: FormData,
): Promise<AcceptTherapistInviteState> {
  const token = await resolveInviteTokenFromSubmit(tokenFromUrl, formData)
  if (!token) {
    return { error: "Linkul de invitație este invalid. Reîncarcă pagina din mesajul primit." }
  }

  const parsed = parseRegisterCredentials(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const inviteError = await assertOpenInvite(token)
  if (inviteError) {
    return { error: inviteError }
  }

  const code = String(formData.get("otp") ?? "")
  const consumed = await consumeAuthEmailOtp({ email: parsed.email, code })
  if (!consumed.ok) {
    return { error: consumed.error }
  }

  const verified = await verifySignupEmailOtp(parsed.email, code)
  if (!verified.ok) {
    const signedIn = await signInAfterEmailVerified({
      email: parsed.email,
      password: parsed.password,
      emailJustVerified: true,
    })
    if (!signedIn.ok) {
      return verifiedSignInFailureMessage(signedIn, verified.error)
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id) {
    return { error: "Nu am putut confirma adresa. Cere un cod nou și încearcă din nou." }
  }

  return attachInviteAndEnterDashboard({
    token,
    userId: user.id,
    email: parsed.email,
  })
}
