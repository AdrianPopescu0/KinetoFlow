"use server"

import { revalidatePath } from "next/cache"

import { getCachedUser } from "@/lib/auth/session"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { resolveInviteSiteUrl } from "@/lib/auth/invite-link"
import { therapistInviteMessage } from "@/lib/clinics/invite-message"
import {
  generateTherapistInviteToken,
  isMissingTherapistInvitesTable,
  MISSING_THERAPIST_INVITES_TABLE,
  THERAPIST_INVITE_TTL_MS,
  therapistInviteUrl,
} from "@/lib/clinics/therapist-invite"
import { canRemoveClinicMember, isClinicAdmin } from "@/lib/clinics/types"
import { ForbiddenError } from "@/lib/http/forbidden"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { patientWhatsAppHref, patientWhatsAppWebHref } from "@/lib/patients/whatsapp"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

export type InviteTherapistState = {
  error?: string
  status?: number
  ok?: boolean
  therapistName?: string
  inviteLink?: string
  phone?: string
  inviteMessage?: string
  whatsappHref?: string
  whatsappWebHref?: string
}

export type RemoveTherapistState = {
  error?: string
  status?: number
  ok?: boolean
}

function normalizeClinicName(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("ro-RO")
}

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

/** Pacienții rămân în cabinet: `therapist_id` cascadează pe ștergerea din Auth. */
async function reassignPatientsToAdmin(
  admin: ReturnType<typeof createServiceRoleClient>,
  targetUserId: string,
  adminUserId: string,
): Promise<string | null> {
  const therapistUpdate = await admin
    .from("patients")
    .update({ therapist_id: adminUserId })
    .eq("therapist_id", targetUserId)
  if (therapistUpdate.error) {
    return formatSupabaseError(therapistUpdate.error)
  }

  const userUpdate = await admin.from("patients").update({ user_id: adminUserId }).eq("user_id", targetUserId)
  if (userUpdate.error && !isMissingColumn(userUpdate.error, "user_id")) {
    return formatSupabaseError(userUpdate.error)
  }

  const assignedUpdate = await admin
    .from("patients")
    .update({ assigned_therapist_id: adminUserId })
    .eq("assigned_therapist_id", targetUserId)
  if (assignedUpdate.error && !isMissingColumn(assignedUpdate.error, "assigned_therapist_id")) {
    return formatSupabaseError(assignedUpdate.error)
  }

  return null
}

function readTrimmed(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

export async function inviteTherapistAction(formData: FormData): Promise<InviteTherapistState> {
  const therapistName = readTrimmed(formData, "therapist_name")
  const phoneRaw = readTrimmed(formData, "phone")

  if (therapistName.length < 2) {
    return { error: "Introdu numele complet al terapeutului." }
  }

  const phone = normalizeStoredPhone(phoneRaw)
  if (!phone) {
    return { error: "Numărul de telefon este obligatoriu (format 07xx sau +40)." }
  }

  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", status: 401 }
  }

  const { profile, error: profileError } = await fetchClinicProfile(supabase, user.id)
  if (profileError) {
    return { error: profileError }
  }
  if (!profile) {
    return { error: "Completează mai întâi profilul clinicii." }
  }
  if (!isClinicAdmin(profile)) {
    throw new ForbiddenError("Doar administratorul clinicii poate invita terapeuți.")
  }

  const clinicName = profile.clinic_name.trim()
  if (!clinicName) {
    return { error: "Profilul cabinetului este incomplet. Reîncarcă pagina." }
  }
  const clinicOwnerId = profile.user_id
  const token = generateTherapistInviteToken()
  const siteUrl = await resolveInviteSiteUrl()
  const inviteLink = therapistInviteUrl(siteUrl, token)
  const expiresAt = new Date(Date.now() + THERAPIST_INVITE_TTL_MS).toISOString()

  try {
    const admin = createServiceRoleClient()

    const { data: existingPhone } = await admin
      .from("clinic_profiles")
      .select("user_id")
      .ilike("clinic_name", clinicName)
      .eq("phone", phone)
      .maybeSingle()

    if (existingPhone) {
      return { error: "Există deja un terapeut cu acest număr de telefon în cabinet." }
    }

    const nowIso = new Date().toISOString()
    const pending = await admin
      .from("therapist_invites")
      .update({ expires_at: nowIso })
      .ilike("clinic_name", clinicName)
      .eq("phone", phone)
      .is("accepted_at", null)
      .gt("expires_at", nowIso)

    if (pending.error) {
      if (isMissingTherapistInvitesTable(pending.error)) {
        return { error: MISSING_THERAPIST_INVITES_TABLE }
      }
      return { error: formatSupabaseError(pending.error) }
    }

    const { error: insertError } = await admin.from("therapist_invites").insert({
      token,
      clinic_name: clinicName,
      clinic_owner_id: clinicOwnerId,
      invited_by: user.id,
      therapist_name: therapistName,
      phone,
      expires_at: expiresAt,
    })

    if (insertError) {
      if (isMissingTherapistInvitesTable(insertError)) {
        return { error: MISSING_THERAPIST_INVITES_TABLE }
      }
      return { error: formatSupabaseError(insertError) }
    }

    const message = therapistInviteMessage({
      therapistName,
      clinicName,
      inviteLink,
    })
    const whatsappHref = patientWhatsAppHref(phone, message)
    const whatsappWebHref = patientWhatsAppWebHref(phone, message)

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/echipa")
    return {
      ok: true,
      therapistName,
      inviteLink,
      phone,
      inviteMessage: message,
      whatsappHref: whatsappHref ?? undefined,
      whatsappWebHref: whatsappWebHref ?? undefined,
    }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error
    }
    const message = error instanceof Error ? error.message : "Nu am putut invita terapeutul."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}

export async function removeTherapistAction(userId: string): Promise<RemoveTherapistState> {
  const targetUserId = typeof userId === "string" ? userId.trim() : ""
  if (!targetUserId) {
    return { error: "Terapeutul nu a fost identificat." }
  }

  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", status: 401 }
  }

  const { profile, error: profileError } = await fetchClinicProfile(supabase, user.id)
  if (profileError) {
    return { error: profileError }
  }
  if (!profile) {
    return { error: "Completează mai întâi profilul clinicii." }
  }
  if (!isClinicAdmin(profile)) {
    throw new ForbiddenError("Doar administratorul clinicii poate șterge terapeuți.")
  }
  if (
    !canRemoveClinicMember({
      actorIsAdmin: true,
      actorUserId: user.id,
      memberRole: "therapist",
      memberUserId: targetUserId,
    })
  ) {
    return { error: "Nu poți șterge acest cont." }
  }

  const clinicName = profile.clinic_name.trim()
  if (!clinicName) {
    return { error: "Profilul cabinetului este incomplet. Reîncarcă pagina." }
  }

  try {
    const admin = createServiceRoleClient()
    const { data: member, error: memberError } = await admin
      .from("clinic_profiles")
      .select("user_id, clinic_name, therapist_name, role")
      .eq("user_id", targetUserId)
      .maybeSingle()

    if (memberError) {
      return { error: formatSupabaseError(memberError) }
    }
    if (!member) {
      return { error: "Terapeutul nu mai există în echipă." }
    }

    if (normalizeClinicName(member.clinic_name) !== normalizeClinicName(clinicName)) {
      throw new ForbiddenError("Doar administratorul clinicii poate șterge terapeuți.")
    }

    if (
      !canRemoveClinicMember({
        actorIsAdmin: true,
        actorUserId: user.id,
        memberRole: typeof member.role === "string" ? member.role : null,
        memberUserId: String(member.user_id),
      })
    ) {
      return { error: "Contul de administrator nu poate fi șters." }
    }

    const reassignError = await reassignPatientsToAdmin(admin, targetUserId, user.id)
    if (reassignError) {
      return { error: reassignError }
    }

    const { error: deleteProfileError } = await admin.from("clinic_profiles").delete().eq("user_id", targetUserId)
    if (deleteProfileError) {
      return { error: formatSupabaseError(deleteProfileError) }
    }

    const { error: deleteUserError } = await admin.auth.admin.deleteUser(targetUserId)
    if (deleteUserError) {
      return { error: formatSupabaseError(deleteUserError) }
    }

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/echipa")
    return { ok: true }
  } catch (error) {
    if (error instanceof ForbiddenError) {
      throw error
    }
    const message = error instanceof Error ? error.message : "Nu am putut șterge terapeutul."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: message }
  }
}
