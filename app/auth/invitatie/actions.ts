"use server"

import { AUTH_ERROR_MESSAGE, parseRegisterCredentials } from "@/lib/auth/validation"
import { redirectAfterTherapistAuth } from "@/lib/auth/redirect-after"
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
} | null

type InviteRow = {
  id: string
  token: string
  clinic_name: string
  clinic_owner_id: string
  invited_by: string
  therapist_name: string
  phone: string
  expires_at: string
  accepted_at: string | null
  accepted_user_id: string | null
}

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

function normalizeClinicName(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("ro-RO")
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
      .select(
        "id, token, clinic_name, clinic_owner_id, invited_by, therapist_name, phone, expires_at, accepted_at, accepted_user_id",
      )
      .eq("token", token)
      .maybeSingle()

    if (error) {
      if (isMissingTherapistInvitesTable(error)) {
        return { error: MISSING_THERAPIST_INVITES_TABLE }
      }
      return { error: formatSupabaseError(error) }
    }

    const invite = data as InviteRow | null
    if (!invite || !isTherapistInviteOpen(invite)) {
      return { error: "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou." }
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.email,
      password: parsed.password,
      email_confirm: true,
      user_metadata: {
        full_name: invite.therapist_name,
        clinic_name: invite.clinic_name,
        clinic_id: invite.clinic_owner_id,
        phone: invite.phone,
        invited_by: invite.invited_by,
        role: "therapist",
      },
      app_metadata: {
        clinic_id: invite.clinic_owner_id,
        role: "therapist",
      },
    })

    let userId = created.user?.id ?? null

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

    const { data: existingProfile, error: profileReadError } = await admin
      .from("clinic_profiles")
      .select("user_id, clinic_name, role")
      .eq("user_id", userId)
      .maybeSingle()

    if (profileReadError) {
      return { error: formatSupabaseError(profileReadError) }
    }

    if (existingProfile) {
      if (normalizeClinicName(existingProfile.clinic_name) !== normalizeClinicName(invite.clinic_name)) {
        return { error: "Acest email aparține deja altei clinici. Folosește o altă adresă sau cere ajutorul administratorului." }
      }
    } else {
      const { error: insertProfileError } = await admin.from("clinic_profiles").insert({
        user_id: userId,
        clinic_name: invite.clinic_name,
        therapist_name: invite.therapist_name,
        phone: invite.phone,
        role: "therapist",
      })
      if (insertProfileError) {
        if (created.user?.id && !emailAlreadyRegistered(createError)) {
          await admin.auth.admin.deleteUser(userId)
        }
        return { error: formatSupabaseError(insertProfileError) }
      }
    }

    await admin
      .from("therapist_invites")
      .update({
        accepted_at: new Date().toISOString(),
        accepted_user_id: userId,
      })
      .eq("id", invite.id)

    if (!created.user || emailAlreadyRegistered(createError)) {
      await redirectAfterTherapistAuth()
      return null
    }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.email,
      password: parsed.password,
    })
    if (signInError) {
      return { error: "Contul a fost creat, dar autentificarea a eșuat. Intră din pagina de login cu același email." }
    }

    await redirectAfterTherapistAuth()
    return null
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut activa invitația."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}
