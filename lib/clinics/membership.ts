import { normalizeAuthEmail } from "@/lib/auth/email-otp"
import { googleAccountEmail } from "@/lib/clinics/invite-attach"
import { isTherapistInviteOpen } from "@/lib/clinics/therapist-invite"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

type AuthUserLike = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  identities?: Array<{
    provider?: string | null
    identity_data?: Record<string, unknown> | null
  }> | null
}

type InviteMembershipRow = {
  clinic_name: string
  clinic_owner_id: string
  therapist_name: string
  phone: string
  accepted_at: string | null
  accepted_user_id: string | null
  expires_at: string
}

async function profileForUser(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<{ clinic_name: string; therapist_name: string; phone: string | null; role: string } | null> {
  const { data, error } = await admin
    .from("clinic_profiles")
    .select("clinic_name, therapist_name, phone, role")
    .eq("user_id", userId)
    .maybeSingle()
  if (error || !data) {
    const fallback = await admin
      .from("clinic_profiles")
      .select("clinic_name, therapist_name")
      .eq("user_id", userId)
      .maybeSingle()
    if (fallback.error || !fallback.data) {
      return null
    }
    const clinicName = String(fallback.data.clinic_name ?? "").trim()
    if (!clinicName) {
      return null
    }
    return {
      clinic_name: clinicName,
      therapist_name: String(fallback.data.therapist_name ?? "").trim(),
      phone: null,
      role: "therapist",
    }
  }
  const clinicName = String(data.clinic_name ?? "").trim()
  if (!clinicName) {
    return null
  }
  return {
    clinic_name: clinicName,
    therapist_name: String(data.therapist_name ?? "").trim(),
    phone: typeof data.phone === "string" ? data.phone : null,
    role: data.role === "admin" ? "admin" : "therapist",
  }
}

async function inviteMembershipForEmail(
  admin: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<InviteMembershipRow | null> {
  const escaped = email.replace(/[\\%_]/g, "\\$&")
  const withEmail = await admin
    .from("therapist_invites")
    .select("clinic_name, clinic_owner_id, therapist_name, phone, accepted_at, accepted_user_id, expires_at")
    .ilike("email", escaped)
    .order("accepted_at", { ascending: false })
    .limit(8)

  if (withEmail.error) {
    return null
  }

  const rows = (withEmail.data ?? []) as InviteMembershipRow[]
  const accepted = rows.find((row) => Boolean(row.accepted_at) && String(row.clinic_name ?? "").trim().length > 0)
  if (accepted) {
    return accepted
  }
  return rows.find((row) => isTherapistInviteOpen(row) && String(row.clinic_name ?? "").trim().length > 0) ?? null
}

async function writeMembershipMetadata(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  input: { clinicName: string; therapistName: string; phone: string | null; clinicOwnerId?: string | null; role: string },
) {
  const clinicId = input.clinicOwnerId || userId
  await admin.auth.admin.updateUserById(userId, {
    email_confirm: true,
    user_metadata: {
      clinic_name: input.clinicName,
      clinic_id: clinicId,
      full_name: input.therapistName || undefined,
      phone: input.phone ?? undefined,
      role: input.role,
    },
    app_metadata: {
      clinic_id: clinicId,
      role: input.role,
    },
  })
}

async function upsertMembershipProfile(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
  input: { clinicName: string; therapistName: string; phone: string | null; role: string },
): Promise<{ error: string | null }> {
  const payload = {
    user_id: userId,
    clinic_name: input.clinicName,
    therapist_name: input.therapistName || "Terapeut",
    phone: input.phone || "",
    role: input.role === "admin" ? "admin" : "therapist",
  }
  const { error } = await admin.from("clinic_profiles").upsert(payload, { onConflict: "user_id" })
  if (!error) {
    return { error: null }
  }
  const withoutRole = await admin.from("clinic_profiles").upsert(
    {
      user_id: userId,
      clinic_name: payload.clinic_name,
      therapist_name: payload.therapist_name,
      phone: payload.phone,
    },
    { onConflict: "user_id" },
  )
  if (withoutRole.error) {
    return { error: formatSupabaseError(withoutRole.error) }
  }
  return { error: null }
}

async function copyMembershipFromOtherAuthUser(
  admin: ReturnType<typeof createServiceRoleClient>,
  user: AuthUserLike,
  email: string,
): Promise<boolean> {
  try {
    const { data } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
    const others = (data?.users ?? []).filter(
      (candidate) => candidate.id !== user.id && normalizeAuthEmail(candidate.email) === email,
    )
    for (const other of others) {
      const profile = await profileForUser(admin, other.id)
      if (!profile) {
        continue
      }
      const written = await upsertMembershipProfile(admin, user.id, {
        clinicName: profile.clinic_name,
        therapistName: profile.therapist_name || String(user.user_metadata?.full_name ?? "").trim(),
        phone: profile.phone,
        role: profile.role,
      })
      if (written.error) {
        continue
      }
      await writeMembershipMetadata(admin, user.id, {
        clinicName: profile.clinic_name,
        therapistName: profile.therapist_name,
        phone: profile.phone,
        clinicOwnerId: other.id,
        role: profile.role,
      })
      return true
    }
  } catch {
    return false
  }
  return false
}

/**
 * Cont existent (admin sau terapeut invitat): profil pe user_id sau același email
 * în clinică / invitații. Doar utilizatorul cu zero urme merge la crearea clinicii.
 */
export async function ensureExistingClinicMembership(user: AuthUserLike): Promise<boolean> {
  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch {
    return false
  }

  const own = await profileForUser(admin, user.id)
  if (own) {
    return true
  }

  const email = googleAccountEmail(user)
  if (!email) {
    return false
  }

  const invite = await inviteMembershipForEmail(admin, email)
  if (invite) {
    const written = await upsertMembershipProfile(admin, user.id, {
      clinicName: invite.clinic_name.trim(),
      therapistName: invite.therapist_name.trim() || String(user.user_metadata?.full_name ?? "").trim(),
      phone: invite.phone,
      role: "therapist",
    })
    if (!written.error) {
      await writeMembershipMetadata(admin, user.id, {
        clinicName: invite.clinic_name.trim(),
        therapistName: invite.therapist_name.trim(),
        phone: invite.phone,
        clinicOwnerId: invite.clinic_owner_id,
        role: "therapist",
      })
      return true
    }
  }

  return copyMembershipFromOtherAuthUser(admin, user, email)
}
