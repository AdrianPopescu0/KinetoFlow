"use server"

import { cookies } from "next/headers"

import { AUTH_ERROR_MESSAGE, parseRegisterCredentials } from "@/lib/auth/validation"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { THERAPIST_INVITE_COOKIE, therapistInviteCookieOptions } from "@/lib/clinics/invite-session"
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
  next?: "/dashboard" | "/onboarding"
} | null

function emailAlreadyRegistered(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  const code = (error.code ?? "").toLowerCase()
  return (
    code.includes("email_exists") ||
    code.includes("user_already_exists") ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already exists")
  )
}

export async function prepareTherapistInviteOAuth(token: string): Promise<AcceptTherapistInviteState> {
  if (!isTherapistInviteToken(token)) {
    return { error: "Linkul de invitație este invalid." }
  }

  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from("therapist_invites")
      .select("expires_at, accepted_at")
      .eq("token", token)
      .maybeSingle()

    if (error) {
      if (isMissingTherapistInvitesTable(error)) {
        return { error: MISSING_THERAPIST_INVITES_TABLE }
      }
      return { error: formatSupabaseError(error) }
    }

    if (!data || !isTherapistInviteOpen(data)) {
      return { error: "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou." }
    }

    const jar = await cookies()
    jar.set(THERAPIST_INVITE_COOKIE, token, therapistInviteCookieOptions())

    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut verifica invitația."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}

export async function acceptTherapistInvite(
  token: string,
  formData: FormData,
): Promise<AcceptTherapistInviteState> {
  if (!isTherapistInviteToken(token)) {
    return { error: "Linkul de invitație este invalid." }
  }

  const parsed = parseRegisterCredentials(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from("therapist_invites")
      .select("id, expires_at, accepted_at, therapist_name, clinic_name, clinic_owner_id, invited_by, phone")
      .eq("token", token)
      .maybeSingle()

    if (error) {
      if (isMissingTherapistInvitesTable(error)) {
        return { error: MISSING_THERAPIST_INVITES_TABLE }
      }
      return { error: formatSupabaseError(error) }
    }

    if (!data || !isTherapistInviteOpen(data)) {
      return { error: "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou." }
    }

    const supabaseForSignOut = await createClient()
    await supabaseForSignOut.auth.signOut()

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.therapist_name,
        clinic_name: data.clinic_name,
        clinic_id: data.clinic_owner_id,
        phone: data.phone,
        invited_by: data.invited_by,
        role: "therapist",
      },
      app_metadata: {
        clinic_id: data.clinic_owner_id,
        role: "therapist",
      },
    })

    let userId = created.user?.id ?? null
    const createdNewUser = Boolean(created.user?.id) && !emailAlreadyRegistered(createError)

    if (createError && emailAlreadyRegistered(createError)) {
      const supabase = await createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      })
      if (signInError) {
        return { error: AUTH_ERROR_MESSAGE }
      }
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } else if (createError || !userId) {
      return { error: createError ? formatSupabaseError(createError) : "Nu am putut crea contul." }
    }

    if (!userId) {
      return { error: AUTH_ERROR_MESSAGE }
    }

    const attached = await attachTherapistInviteToUser({
      token,
      user: { id: userId, email: parsed.email },
    })
    if (!attached.ok) {
      if (createdNewUser) {
        await admin.auth.admin.deleteUser(userId)
      } else {
        const supabase = await createClient()
        await supabase.auth.signOut()
      }
      return { error: attached.error }
    }

    const jar = await cookies()
    jar.set(THERAPIST_INVITE_COOKIE, token, therapistInviteCookieOptions())

    if (!createdNewUser) {
      jar.delete(THERAPIST_INVITE_COOKIE)
      return { next: "/dashboard" }
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    })
    if (signInError) {
      return { error: "Contul a fost creat, dar autentificarea a eșuat. Intră din pagina de login cu același email." }
    }

    jar.delete(THERAPIST_INVITE_COOKIE)
    return { next: "/dashboard" }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut activa invitația."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}
