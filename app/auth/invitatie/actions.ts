"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { parseInviteActivation } from "@/lib/auth/accept-invite"
import {
  isEmailAlreadyRegisteredError,
  isEmailConfirmedUser,
} from "@/lib/auth/email-confirmed"
import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import {
  findAuthUserIdByEmail,
  signInAfterEmailVerified,
} from "@/lib/auth/verified-password-session"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import {
  THERAPIST_INVITE_CLIENT_COOKIE,
  THERAPIST_INVITE_COOKIE,
  clearTherapistInviteCookies,
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
  next?: "/dashboard"
} | null

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră cu aceeași parolă sau continuă cu Google."

const MISSING_INVITE_EMAIL =
  "Invitația nu include un email. Cere administratorului un link nou, cu adresa ta."

function isMissingColumn(error: { message?: string; code?: string } | null, column: string): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "PGRST204" ||
    (message.includes(column.toLowerCase()) &&
      (message.includes("could not find") || message.includes("schema cache") || message.includes("does not exist")))
  )
}

async function loadOpenInvite(token: string): Promise<
  | { error: string }
  | { email: string | null; clinicName: string; therapistName: string }
> {
  try {
    const admin = createServiceRoleClient()
    const withEmail = await admin
      .from("therapist_invites")
      .select("id, email, clinic_name, therapist_name, expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle()

    const result =
      withEmail.error && isMissingColumn(withEmail.error, "email")
        ? await admin
            .from("therapist_invites")
            .select("id, clinic_name, therapist_name, expires_at, accepted_at")
            .eq("token", token)
            .maybeSingle()
        : withEmail

    if (result.error) {
      if (isMissingTherapistInvitesTable(result.error)) {
        return { error: MISSING_THERAPIST_INVITES_TABLE }
      }
      return { error: formatSupabaseError(result.error) }
    }

    if (!result.data || !isTherapistInviteOpen(result.data)) {
      return { error: "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou." }
    }

    const rawEmail =
      "email" in result.data && typeof result.data.email === "string" ? result.data.email.trim().toLowerCase() : ""

    return {
      email: rawEmail || null,
      clinicName: String(result.data.clinic_name ?? "").trim(),
      therapistName: String(result.data.therapist_name ?? "").trim(),
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut verifica invitația."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
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

async function userHasClinicProfile(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await admin.from("clinic_profiles").select("user_id").eq("user_id", userId).maybeSingle()
  return Boolean(data && typeof data.user_id === "string")
}

/**
 * Creează contul Auth (email deja confirmat) sau reia un signup incomplet.
 * Nu trimite OTP și nu trece prin signUp/signInWithOtp.
 */
async function createOrReuseInvitedAuthUser(input: {
  email: string
  password: string
  token: string
  therapistName: string
  clinicName: string
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const admin = createServiceRoleClient()
  const metadata = {
    full_name: input.therapistName,
    clinic_name: input.clinicName,
    invite_token: input.token,
    invited: true,
    role: "therapist",
  }

  const created = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (!created.error && created.data.user?.id) {
    return { ok: true, userId: created.data.user.id }
  }

  if (created.error && !isEmailAlreadyRegisteredError(created.error)) {
    return { ok: false, error: formatSupabaseError(created.error) }
  }

  const existingId = await findAuthUserIdByEmail(input.email)
  if (!existingId) {
    return { ok: false, error: EXISTING_ACCOUNT_MESSAGE }
  }

  const hasClinic = await userHasClinicProfile(admin, existingId)
  if (!hasClinic) {
    const { error: updateError } = await admin.auth.admin.updateUserById(existingId, {
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    })
    if (updateError) {
      return { ok: false, error: updateError.message }
    }
  }

  return { ok: true, userId: existingId }
}

export async function prepareTherapistInviteOAuth(token: string): Promise<AcceptTherapistInviteState> {
  if (!isTherapistInviteToken(token)) {
    return { error: "Linkul de invitație este invalid." }
  }

  const invite = await loadOpenInvite(token)
  if ("error" in invite) {
    return { error: invite.error }
  }

  const jar = await cookies()
  writeTherapistInviteCookies((name, value, options) => jar.set(name, value, options), token)
  return null
}

export async function acceptTherapistInvite(
  tokenFromUrl: string,
  formData: FormData,
): Promise<AcceptTherapistInviteState> {
  const token = await resolveInviteTokenFromSubmit(tokenFromUrl, formData)
  if (!token) {
    return { error: "Linkul de invitație este invalid. Reîncarcă pagina din mesajul primit." }
  }

  const parsed = parseInviteActivation(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const invite = await loadOpenInvite(token)
  if ("error" in invite) {
    return { error: invite.error }
  }
  if (!invite.email) {
    return { error: MISSING_INVITE_EMAIL }
  }

  const supabase = await createClient()
  await supabase.auth.signOut()

  let created: { ok: true; userId: string } | { ok: false; error: string }
  try {
    created = await createOrReuseInvitedAuthUser({
      email: invite.email,
      password: parsed.password,
      token,
      therapistName: invite.therapistName,
      clinicName: invite.clinicName,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut crea contul."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }

  if (!created.ok) {
    return { error: created.error }
  }

  const signedIn = await signInAfterEmailVerified({
    email: invite.email,
    password: parsed.password,
    userId: created.userId,
    emailJustVerified: true,
  })
  if (!signedIn.ok) {
    await supabase.auth.signOut()
    return { error: EXISTING_ACCOUNT_MESSAGE }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.id || !isEmailConfirmedUser(user)) {
    await supabase.auth.signOut()
    return { error: "Nu am putut deschide sesiunea. Încearcă din nou." }
  }

  const attached = await attachTherapistInviteToUser({
    token,
    user: { id: user.id, email: invite.email },
  })
  if (!attached.ok) {
    await supabase.auth.signOut()
    return { error: attached.error }
  }

  await supabase.auth.refreshSession()
  const jar = await cookies()
  jar.delete(SIGNED_OUT_GATE_COOKIE)
  jar.delete(VERIFIED_OTP_COOKIE)
  clearTherapistInviteCookies((name, value, options) => jar.set(name, value, options))

  redirect("/dashboard")
}
