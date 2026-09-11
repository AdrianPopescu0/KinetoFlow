import { decideTherapistInviteAttach, googleAccountEmail, pickTherapistInviteCandidate } from "@/lib/clinics/invite-attach"
import { normalizeAuthEmail } from "@/lib/auth/email-otp"
import {
  isMissingTherapistInvitesTable,
  isTherapistInviteToken,
  MISSING_THERAPIST_INVITES_TABLE,
} from "@/lib/clinics/therapist-invite"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export type AttachTherapistInviteResult =
  | { ok: true }
  | { ok: false; error: string; reason: "expired" | "other_clinic" | "no_email" | "failed" | "no_invite" }

type InviteUser = {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  identities?: Array<{
    provider?: string | null
    identity_data?: Record<string, unknown> | null
  }> | null
}

type InviteRow = {
  id: string
  token: string
  clinic_name: string
  clinic_owner_id: string
  invited_by: string
  therapist_name: string
  phone: string
  email?: string | null
  expires_at: string
  accepted_at: string | null
  accepted_user_id: string | null
}

const INVITE_SELECT_WITH_EMAIL =
  "id, token, clinic_name, clinic_owner_id, invited_by, therapist_name, phone, email, expires_at, accepted_at, accepted_user_id"
const INVITE_SELECT =
  "id, token, clinic_name, clinic_owner_id, invited_by, therapist_name, phone, expires_at, accepted_at, accepted_user_id"

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

function asInviteRow(data: unknown): InviteRow | null {
  if (!data || typeof data !== "object") {
    return null
  }
  const row = data as Record<string, unknown>
  if (typeof row.id !== "string" || typeof row.token !== "string") {
    return null
  }
  return {
    id: row.id,
    token: row.token,
    clinic_name: String(row.clinic_name ?? ""),
    clinic_owner_id: String(row.clinic_owner_id ?? ""),
    invited_by: String(row.invited_by ?? ""),
    therapist_name: String(row.therapist_name ?? ""),
    phone: String(row.phone ?? ""),
    email: typeof row.email === "string" ? row.email : null,
    expires_at: String(row.expires_at ?? ""),
    accepted_at: typeof row.accepted_at === "string" ? row.accepted_at : null,
    accepted_user_id: typeof row.accepted_user_id === "string" ? row.accepted_user_id : null,
  }
}

async function selectInvite(
  admin: ReturnType<typeof createServiceRoleClient>,
  select: string,
  apply: (query: ReturnType<ReturnType<typeof createServiceRoleClient>["from"]>) => PromiseLike<{
    data: unknown
    error: { message?: string; code?: string } | null
  }>,
): Promise<{ row: InviteRow | null; missingEmailColumn: boolean; error: string | null }> {
  const first = await apply(admin.from("therapist_invites").select(select))
  if (first.error) {
    if (isMissingTherapistInvitesTable(first.error)) {
      return { row: null, missingEmailColumn: false, error: MISSING_THERAPIST_INVITES_TABLE }
    }
    if (select.includes("email") && isMissingColumn(first.error, "email")) {
      return { row: null, missingEmailColumn: true, error: null }
    }
    return { row: null, missingEmailColumn: false, error: formatSupabaseError(first.error) }
  }
  return { row: asInviteRow(first.data), missingEmailColumn: false, error: null }
}

async function loadPendingTherapistInvite(input: {
  token?: string | null
  email?: string | null
  userId: string
}): Promise<{ row: InviteRow | null; error: string | null }> {
  const admin = createServiceRoleClient()
  let select = INVITE_SELECT_WITH_EMAIL
  const nowIso = new Date().toISOString()

  async function byToken(token: string) {
    return selectInvite(admin, select, (query) => query.eq("token", token).maybeSingle())
  }
  async function byEmail(email: string) {
    const escaped = email.replace(/[\\%_]/g, "\\$&")
    return selectInvite(admin, select, (query) =>
      query
        .ilike("email", escaped)
        .is("accepted_at", null)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    )
  }
  async function byAcceptedUser(userId: string) {
    return selectInvite(admin, select, (query) =>
      query.eq("accepted_user_id", userId).order("accepted_at", { ascending: false }).limit(1).maybeSingle(),
    )
  }

  let tokenRow: InviteRow | null = null
  let emailRow: InviteRow | null = null
  let acceptedRow: InviteRow | null = null

  if (input.token && isTherapistInviteToken(input.token)) {
    const loaded = await byToken(input.token)
    if (loaded.error) {
      return { row: null, error: loaded.error }
    }
    if (loaded.missingEmailColumn) {
      select = INVITE_SELECT
      const retry = await byToken(input.token)
      if (retry.error) {
        return { row: null, error: retry.error }
      }
      tokenRow = retry.row
    } else {
      tokenRow = loaded.row
    }
  }

  if (select === INVITE_SELECT_WITH_EMAIL && input.email) {
    const loaded = await byEmail(input.email)
    if (loaded.missingEmailColumn) {
      select = INVITE_SELECT
    } else if (loaded.error) {
      return { row: null, error: loaded.error }
    } else {
      emailRow = loaded.row
    }
  }

  const accepted = await byAcceptedUser(input.userId)
  if (accepted.missingEmailColumn) {
    select = INVITE_SELECT
    const retry = await byAcceptedUser(input.userId)
    if (retry.error) {
      return { row: null, error: retry.error }
    }
    acceptedRow = retry.row
  } else if (accepted.error) {
    return { row: null, error: accepted.error }
  } else {
    acceptedRow = accepted.row
  }

  return {
    row: pickTherapistInviteCandidate({
      byToken: tokenRow,
      byEmail: emailRow,
      byAcceptedUser: acceptedRow,
      userId: input.userId,
    }) as InviteRow | null,
    error: null,
  }
}

export async function stampTherapistInviteEmail(token: string, emailRaw: string): Promise<void> {
  const email = normalizeAuthEmail(emailRaw)
  if (!email || !isTherapistInviteToken(token)) {
    return
  }
  try {
    const admin = createServiceRoleClient()
    const { error } = await admin.from("therapist_invites").update({ email }).eq("token", token).is("accepted_at", null)
    if (error && !isMissingColumn(error, "email") && !isMissingTherapistInvitesTable(error)) {
      console.warn("[invite] nu am putut salva emailul pe invitație:", formatSupabaseError(error))
    }
  } catch (error) {
    console.warn("[invite] nu am putut salva emailul pe invitație:", error instanceof Error ? error.message : error)
  }
}

async function upsertTherapistClinicProfile(input: {
  userId: string
  clinicName: string
  therapistName: string
  phone: string
  existingUserId: string | null
}): Promise<{ error: string | null }> {
  const admin = createServiceRoleClient()
  const payload = {
    user_id: input.userId,
    clinic_name: input.clinicName,
    therapist_name: input.therapistName,
    phone: input.phone,
    role: "therapist" as const,
  }

  if (input.existingUserId === input.userId) {
    const { error } = await admin
      .from("clinic_profiles")
      .update({
        clinic_name: input.clinicName,
        therapist_name: input.therapistName,
        phone: input.phone,
        role: "therapist",
      })
      .eq("user_id", input.userId)
    if (error) {
      return { error: formatSupabaseError(error) }
    }
    return { error: null }
  }

  const { error: insertError } = await admin.from("clinic_profiles").insert(payload)
  if (!insertError) {
    return { error: null }
  }
  if (isUniqueMembershipError(insertError)) {
    const { error: updateError } = await admin
      .from("clinic_profiles")
      .update({
        clinic_name: input.clinicName,
        therapist_name: input.therapistName,
        phone: input.phone,
        role: "therapist",
      })
      .eq("user_id", input.userId)
    if (updateError) {
      return { error: formatSupabaseError(updateError) }
    }
    return { error: null }
  }
  return { error: formatSupabaseError(insertError) }
}

/**
 * Asociază contul (inclusiv Google) cu invitația pending.
 * Caută întâi invitația / rândul pending după token sau emailul Google,
 * abia apoi verifică dacă user_id-ul nou are deja o clinică.
 */
export async function attachTherapistInviteToUser(input: {
  token?: string | null
  user: InviteUser
}): Promise<AttachTherapistInviteResult> {
  const token = typeof input.token === "string" && isTherapistInviteToken(input.token) ? input.token : null
  const lookupEmail = googleAccountEmail(input.user)

  try {
    const admin = createServiceRoleClient()
    const loaded = await loadPendingTherapistInvite({
      token,
      email: lookupEmail,
      userId: input.user.id,
    })
    if (loaded.error) {
      console.error("[invite-activate] load-pending-invite", loaded.error)
      return { ok: false, error: loaded.error, reason: "failed" }
    }

    const data = loaded.row
    if (data && (data.clinic_owner_id === input.user.id || data.invited_by === input.user.id)) {
      return { ok: true }
    }

    const email = googleAccountEmail(input.user) ?? normalizeAuthEmail(data?.email)

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
      if (!token && decision.action === "expired") {
        return { ok: false, error: decision.error ?? "Nu există o invitație pending pentru acest email.", reason: "no_invite" }
      }
      return { ok: false, error: decision.error ?? "Nu am putut activa invitația.", reason: decision.action }
    }

    if (!data) {
      if (!token) {
        return {
          ok: false,
          error: "Nu există o invitație pending pentru acest email.",
          reason: "no_invite",
        }
      }
      return {
        ok: false,
        error: "Invitația a expirat sau a fost deja folosită. Cere administratorului un link nou.",
        reason: "expired",
      }
    }

    if (decision.action === "attach" || decision.action === "already_member") {
      if (decision.action === "attach") {
        const upserted = await upsertTherapistClinicProfile({
          userId: input.user.id,
          clinicName: data.clinic_name,
          therapistName: data.therapist_name,
          phone: data.phone,
          existingUserId: existingProfile?.user_id ?? null,
        })
        if (upserted.error) {
          console.error("[invite-activate] clinic_profiles.upsert", upserted.error)
          return { ok: false, error: upserted.error, reason: "failed" }
        }
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
        invite_token: data.token,
        invited: true,
        role: "therapist",
      },
      app_metadata: {
        clinic_id: data.clinic_owner_id,
        role: "therapist",
        invite_token: data.token,
      },
    })
    if (updateError) {
      console.error("[invite-activate] auth.updateUserById", formatSupabaseError(updateError), updateError)
      return { ok: false, error: formatSupabaseError(updateError), reason: "failed" }
    }

    const inviteUpdate: Record<string, unknown> = {}
    if (!data.accepted_at || data.accepted_user_id !== input.user.id) {
      inviteUpdate.accepted_at = new Date().toISOString()
      inviteUpdate.accepted_user_id = input.user.id
    }
    if (email && data.email !== email) {
      inviteUpdate.email = email
    }
    if (Object.keys(inviteUpdate).length > 0) {
      const { error: acceptError } = await admin.from("therapist_invites").update(inviteUpdate).eq("id", data.id)
      if (acceptError) {
        if (isMissingColumn(acceptError, "email") && inviteUpdate.email) {
          delete inviteUpdate.email
          if (Object.keys(inviteUpdate).length > 0) {
            const retry = await admin.from("therapist_invites").update(inviteUpdate).eq("id", data.id)
            if (retry.error) {
              console.error("[invite-activate] therapist_invites.update", formatSupabaseError(retry.error), retry.error)
              return { ok: false, error: formatSupabaseError(retry.error), reason: "failed" }
            }
          }
        } else {
          console.error("[invite-activate] therapist_invites.update", formatSupabaseError(acceptError), acceptError)
          return { ok: false, error: formatSupabaseError(acceptError), reason: "failed" }
        }
      }
    }

    console.info(
      "[invite-activate] therapist_invites.update ok",
      JSON.stringify({
        inviteId: data.id,
        accepted_user_id: input.user.id,
        accepted_at: inviteUpdate.accepted_at ?? data.accepted_at,
      }),
    )
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

function isUniqueMembershipError(error: { code?: string; message?: string } | null): boolean {
  if (!error) {
    return false
  }
  const code = (error.code ?? "").toLowerCase()
  const message = (error.message ?? "").toLowerCase()
  return code === "23505" || message.includes("duplicate") || message.includes("unique")
}
