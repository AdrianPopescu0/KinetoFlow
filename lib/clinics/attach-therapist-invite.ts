import { decideTherapistInviteAttach, googleAccountEmail } from "@/lib/clinics/invite-attach"
import {
  isMissingTherapistInvitesTable,
  isTherapistInviteToken,
  MISSING_THERAPIST_INVITES_TABLE,
} from "@/lib/clinics/therapist-invite"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export type AttachTherapistInviteResult =
  | { ok: true }
  | { ok: false; error: string; reason: "expired" | "other_clinic" | "no_email" | "failed" }

type InviteUser = {
  id: string
  email?: string | null
  identities?: Array<{
    provider?: string | null
    identity_data?: Record<string, unknown> | null
  }> | null
}

export async function attachTherapistInviteToUser(input: {
  token: string
  user: InviteUser
}): Promise<AttachTherapistInviteResult> {
  if (!isTherapistInviteToken(input.token)) {
    return { ok: false, error: "Linkul de invitație este invalid.", reason: "expired" }
  }

  const email = googleAccountEmail(input.user)
  try {
    const admin = createServiceRoleClient()
    const { data, error } = await admin
      .from("therapist_invites")
      .select(
        "id, token, clinic_name, clinic_owner_id, invited_by, therapist_name, phone, expires_at, accepted_at, accepted_user_id",
      )
      .eq("token", input.token)
      .maybeSingle()

    if (error) {
      if (isMissingTherapistInvitesTable(error)) {
        return { ok: false, error: MISSING_THERAPIST_INVITES_TABLE, reason: "failed" }
      }
      return { ok: false, error: formatSupabaseError(error), reason: "failed" }
    }

    if (data && (data.clinic_owner_id === input.user.id || data.invited_by === input.user.id)) {
      return { ok: true }
    }

    const { data: existingProfile, error: profileReadError } = await admin
      .from("clinic_profiles")
      .select("user_id, clinic_name, role")
      .eq("user_id", input.user.id)
      .maybeSingle()

    if (profileReadError) {
      return { ok: false, error: formatSupabaseError(profileReadError), reason: "failed" }
    }

    const decision = decideTherapistInviteAttach({
      email,
      userId: input.user.id,
      invite: data,
      existingClinicName: existingProfile?.clinic_name ?? null,
    })

    if (decision.action === "expired" || decision.action === "other_clinic" || decision.action === "no_email") {
      return { ok: false, error: decision.error ?? "Nu am putut activa invitația.", reason: decision.action }
    }

    if (!data) {
      return { ok: false, error: "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou.", reason: "expired" }
    }

    if (decision.action === "attach") {
      const { error: insertProfileError } = await admin.from("clinic_profiles").insert({
        user_id: input.user.id,
        clinic_name: data.clinic_name,
        therapist_name: data.therapist_name,
        phone: data.phone,
        role: "therapist",
      })
      if (insertProfileError) {
        return { ok: false, error: formatSupabaseError(insertProfileError), reason: "failed" }
      }
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(input.user.id, {
      email_confirm: true,
      user_metadata: {
        full_name: data.therapist_name,
        clinic_name: data.clinic_name,
        clinic_id: data.clinic_owner_id,
        phone: data.phone,
        invited_by: data.invited_by,
        invite_token: input.token,
        invited: true,
        role: "therapist",
      },
      app_metadata: {
        clinic_id: data.clinic_owner_id,
        role: "therapist",
        invite_token: input.token,
      },
    })
    if (updateError) {
      return { ok: false, error: updateError.message, reason: "failed" }
    }

    if (!data.accepted_at || data.accepted_user_id !== input.user.id) {
      const { error: acceptError } = await admin
        .from("therapist_invites")
        .update({
          accepted_at: new Date().toISOString(),
          accepted_user_id: input.user.id,
        })
        .eq("id", data.id)
      if (acceptError) {
        return { ok: false, error: formatSupabaseError(acceptError), reason: "failed" }
      }
    }

    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut activa invitația."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return {
        ok: false,
        error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local.",
        reason: "failed",
      }
    }
    return { ok: false, error: message, reason: "failed" }
  }
}
