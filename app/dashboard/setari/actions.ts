"use server"

import { revalidatePath } from "next/cache"

import { getCachedUser } from "@/lib/auth/session"
import { evaluateRegisterPassword, REGISTER_PASSWORD_HINT } from "@/lib/auth/password"
import { privilegedClinicClient } from "@/lib/clinics/members"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { isClinicAdmin } from "@/lib/clinics/types"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createClient } from "@/utils/supabase/server"

export type AccountSettingsState = {
  error?: string
  ok?: boolean
  message?: string
} | null

function readRequired(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function normalizeClinicName(value: string): string {
  return value.trim().toLocaleLowerCase("ro-RO")
}

export async function updateAccountProfile(formData: FormData): Promise<AccountSettingsState> {
  const therapistName = readRequired(formData, "therapist_full_name")
  const phoneRaw = readRequired(formData, "contact_phone")
  const clinicNameInput = readRequired(formData, "clinic_name")

  if (!therapistName) {
    return { error: "Introdu numele și prenumele." }
  }
  if (!phoneRaw) {
    return { error: "Introdu numărul de telefon." }
  }

  const phone = normalizeStoredPhone(phoneRaw)
  if (!phone) {
    return { error: "Numărul de telefon nu este valid. Folosește un format românesc, de exemplu 07xx xxx xxx." }
  }

  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const { profile, error: profileError } = await fetchClinicProfile(supabase, user.id)
  if (profileError) {
    return { error: profileError }
  }
  if (!profile) {
    return { error: "Profilul clinicii lipsește. Reia configurarea cabinetului." }
  }

  const admin = isClinicAdmin(profile)
  const nextClinicName = admin ? (clinicNameInput ?? profile.clinic_name.trim()) : profile.clinic_name.trim()
  if (admin && !clinicNameInput) {
    return { error: "Introdu numele clinicii sau al cabinetului." }
  }

  const ownUpdate = await supabase
    .from("clinic_profiles")
    .update({
      therapist_name: therapistName,
      phone,
      ...(admin ? { clinic_name: nextClinicName } : {}),
    })
    .eq("user_id", user.id)

  if (ownUpdate.error) {
    return { error: formatSupabaseError(ownUpdate.error) }
  }

  const oldClinicName = profile.clinic_name.trim()
  const renamed = admin && nextClinicName.length > 0 && normalizeClinicName(oldClinicName) !== normalizeClinicName(nextClinicName)

  if (renamed) {
    const clinicClient = await privilegedClinicClient(supabase)
    const { data: members, error: membersError } = await clinicClient
      .from("clinic_profiles")
      .select("user_id, clinic_name")
      .ilike("clinic_name", oldClinicName)

    if (membersError) {
      return { error: formatSupabaseError(membersError) }
    }

    const wanted = normalizeClinicName(oldClinicName)
    const memberIds = (members ?? [])
      .filter(
        (row) =>
          typeof row.user_id === "string" &&
          row.user_id !== user.id &&
          normalizeClinicName(String(row.clinic_name ?? "")) === wanted,
      )
      .map((row) => String(row.user_id))

    if (memberIds.length > 0) {
      const bulk = await clinicClient
        .from("clinic_profiles")
        .update({ clinic_name: nextClinicName })
        .in("user_id", memberIds)
      if (bulk.error) {
        return { error: formatSupabaseError(bulk.error) }
      }
    }

    const invites = await clinicClient
      .from("therapist_invites")
      .update({ clinic_name: nextClinicName })
      .ilike("clinic_name", oldClinicName)
      .is("accepted_at", null)
    if (invites.error) {
      return { error: formatSupabaseError(invites.error) }
    }
  }

  const { error: metadataError } = await supabase.auth.updateUser({
    data: {
      full_name: therapistName,
      clinic_name: nextClinicName,
      phone,
    },
  })
  if (metadataError) {
    return { error: formatSupabaseError(metadataError) }
  }

  revalidatePath("/", "layout")
  revalidatePath("/dashboard/setari")
  revalidatePath("/dashboard/echipa")
  return { ok: true, message: "Datele contului au fost salvate." }
}

export async function updateAccountPassword(formData: FormData): Promise<AccountSettingsState> {
  const passwordRaw = formData.get("password")
  const confirmRaw = formData.get("confirm_password")
  const password = typeof passwordRaw === "string" ? passwordRaw : ""
  const confirm = typeof confirmRaw === "string" ? confirmRaw : ""

  if (!evaluateRegisterPassword(password).isValid) {
    return { error: REGISTER_PASSWORD_HINT }
  }
  if (password !== confirm) {
    return { error: "Parolele nu coincid." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    return { error: formatSupabaseError(error) }
  }

  return { ok: true, message: "Parola a fost actualizată." }
}
