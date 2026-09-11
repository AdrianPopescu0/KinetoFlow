"use server"

import { cookies, headers } from "next/headers"

import { isExistingAuthUserError, parseInviteActivation } from "@/lib/auth/accept-invite"
import { isEmailAlreadyRegisteredError } from "@/lib/auth/email-confirmed"
import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"
import {
  confirmAuthUserEmailById,
  findAuthUserIdByEmail,
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

function logInviteActivate(step: string, detail?: unknown) {
  if (detail == null) {
    console.info("[invite-activate]", step)
    return
  }
  if (typeof detail === "object" && ("message" in detail || "code" in detail || "details" in detail || "hint" in detail)) {
    const formatted = formatSupabaseError(
      detail as { message?: string; code?: string; details?: string; hint?: string },
    )
    console.error("[invite-activate]", step, formatted, detail)
    return
  }
  console.info("[invite-activate]", step, detail)
}

async function applyInvitedAuthCredentials(
  userId: string,
  input: { password: string; metadata: Record<string, unknown> },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createServiceRoleClient()
  const { error } = await admin.auth.admin.updateUserById(userId, {
    password: input.password,
    email_confirm: true,
    user_metadata: input.metadata,
  })
  if (error) {
    logInviteActivate("updateUserById", error)
    return { ok: false, error: formatSupabaseError(error) }
  }
  return { ok: true }
}

/**
 * Creează contul Auth sau, dacă emailul există deja, setează parola și confirmă adresa.
 * Nu trimite OTP.
 */
async function upsertInvitedAuthUser(input: {
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

  const existingId = await findAuthUserIdByEmail(input.email)
  if (existingId) {
    logInviteActivate(`auth.user.existent ${existingId}`)
    const updated = await applyInvitedAuthCredentials(existingId, { password: input.password, metadata })
    if (!updated.ok) {
      return updated
    }
    return { ok: true, userId: existingId }
  }

  const created = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: metadata,
  })

  if (!created.error && created.data.user?.id) {
    logInviteActivate(`auth.user.creat ${created.data.user.id}`)
    return { ok: true, userId: created.data.user.id }
  }

  logInviteActivate("createUser", created.error)

  if (created.error && !isExistingAuthUserError(created.error) && !isEmailAlreadyRegisteredError(created.error)) {
    return { ok: false, error: formatSupabaseError(created.error) }
  }

  const retryId = await findAuthUserIdByEmail(input.email)
  if (!retryId) {
    return { ok: false, error: created.error ? formatSupabaseError(created.error) : EXISTING_ACCOUNT_MESSAGE }
  }

  const updated = await applyInvitedAuthCredentials(retryId, { password: input.password, metadata })
  if (!updated.ok) {
    return updated
  }
  return { ok: true, userId: retryId }
}

type InviteSessionUser = { id: string; email?: string | null }

function sessionUserFromAuthResult(result: { data?: unknown }): InviteSessionUser | null {
  const data = result.data
  if (!data || typeof data !== "object") {
    return null
  }
  const record = data as {
    user?: InviteSessionUser | null
    session?: { user?: InviteSessionUser | null } | null
  }
  const user = record.user ?? record.session?.user ?? null
  return user?.id ? user : null
}

async function openInvitePasswordSession(input: {
  supabase: Awaited<ReturnType<typeof createClient>>
  email: string
  password: string
  userId: string
}): Promise<{ ok: true; user: InviteSessionUser } | { ok: false; error: string }> {
  const { supabase } = input

  const first = await supabase.auth.signInWithPassword({ email: input.email, password: input.password })
  const firstUser = sessionUserFromAuthResult(first)
  if (!first.error && firstUser) {
    return { ok: true, user: firstUser }
  }
  logInviteActivate("signInWithPassword", first.error)

  const confirmed = await confirmAuthUserEmailById(input.userId)
  if (!confirmed.ok && confirmed.kind === "confirm_failed") {
    logInviteActivate("email_confirm", { message: confirmed.message })
  }

  const second = await supabase.auth.signInWithPassword({ email: input.email, password: input.password })
  const secondUser = sessionUserFromAuthResult(second)
  if (!second.error && secondUser) {
    return { ok: true, user: secondUser }
  }
  logInviteActivate("signInWithPassword.retry", second.error)

  try {
    const admin = createServiceRoleClient()
    const link = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: input.email,
    })
    const tokenHash = link.data.properties?.hashed_token
    if (link.error || !tokenHash) {
      logInviteActivate("generateLink", link.error)
      return {
        ok: false,
        error: link.error
          ? formatSupabaseError(link.error)
          : second.error
            ? formatSupabaseError(second.error)
            : "Nu am putut deschide sesiunea după setarea parolei.",
      }
    }

    const verified = await supabase.auth.verifyOtp({
      type: "email",
      token_hash: tokenHash,
    })
    const verifiedUser = sessionUserFromAuthResult(verified)
    if (verified.error || !verifiedUser) {
      logInviteActivate("verifyOtp.magiclink", verified.error)
      return {
        ok: false,
        error: verified.error
          ? formatSupabaseError(verified.error)
          : "Nu am putut deschide sesiunea. Verifică parola și încearcă din nou.",
      }
    }
    return { ok: true, user: verifiedUser }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut deschide sesiunea."
    logInviteActivate("openSession.exceptie", { message })
    return { ok: false, error: message }
  }
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
    logInviteActivate("load-invite", { message: invite.error })
    return { error: invite.error }
  }
  if (!invite.email) {
    return { error: MISSING_INVITE_EMAIL }
  }

  const supabase = await createClient()

  try {
    const created = await upsertInvitedAuthUser({
      email: invite.email,
      password: parsed.password,
      token,
      therapistName: invite.therapistName,
      clinicName: invite.clinicName,
    })
    if (!created.ok) {
      logInviteActivate("upsert-auth", { message: created.error })
      return { error: created.error }
    }

    const attached = await attachTherapistInviteToUser({
      token,
      user: { id: created.userId, email: invite.email },
    })
    if (!attached.ok) {
      logInviteActivate("attach-invite", { message: attached.error, code: attached.reason })
      return { error: attached.error }
    }
    logInviteActivate(`invite.atașată user=${created.userId}`)

    // Nu facem signOut înainte de signIn: ambele scriu Set-Cookie pe același
    // răspuns, iar cookie-ul gol de la signOut poate anula sesiunea nouă.
    const session = await openInvitePasswordSession({
      supabase,
      email: invite.email,
      password: parsed.password,
      userId: created.userId,
    })
    if (!session.ok) {
      logInviteActivate("open-session", { message: session.error })
      return { error: session.error }
    }

    const jar = await cookies()
    jar.delete(SIGNED_OUT_GATE_COOKIE)
    jar.delete(VERIFIED_OTP_COOKIE)
    clearTherapistInviteCookies((name, value, options) => jar.set(name, value, options))

    logInviteActivate(`activat user=${created.userId} → /dashboard`)
    return { next: "/dashboard" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut activa invitația."
    logInviteActivate("activate-exception", error)
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}
