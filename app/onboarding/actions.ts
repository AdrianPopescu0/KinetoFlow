"use server"

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"

import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { THERAPIST_INVITE_COOKIE, therapistInviteCookieOptions } from "@/lib/clinics/invite-session"
import { isTherapistInviteToken } from "@/lib/clinics/therapist-invite"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createClient } from "@/utils/supabase/server"

export type OnboardingState = {
  error?: string
  ok?: boolean
} | null

export type ClaimPendingInviteResult =
  | { ok: true }
  | { ok: false; error: string; reason?: "expired" | "other_clinic" | "no_email" | "failed" }

export async function claimPendingTherapistInvite(token: string): Promise<ClaimPendingInviteResult> {
  if (!isTherapistInviteToken(token)) {
    return { ok: false, error: "Linkul de invitație este invalid.", reason: "expired" }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user || !isEmailConfirmedUser(user)) {
    return { ok: false, error: "Autentificarea a expirat. Intră din nou în cont.", reason: "failed" }
  }

  const attached = await attachTherapistInviteToUser({ token, user })
  if (!attached.ok) {
    return { ok: false, error: attached.error, reason: attached.reason }
  }

  const jar = await cookies()
  jar.set(THERAPIST_INVITE_COOKIE, token, therapistInviteCookieOptions())
  await supabase.auth.refreshSession()
  revalidatePath("/", "layout")
  return { ok: true }
}

function readRequired(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function saveClinicProfile(formData: FormData): Promise<OnboardingState> {
  const clinicName = readRequired(formData, "clinic_name")
  const therapistName = readRequired(formData, "therapist_full_name")
  const phoneRaw = readRequired(formData, "contact_phone")

  if (!clinicName) {
    return { error: "Introdu numele clinicii sau al cabinetului." }
  }
  if (!therapistName) {
    return { error: "Introdu numele și prenumele terapeutului." }
  }
  if (!phoneRaw) {
    return { error: "Introdu telefonul / WhatsApp al clinicii." }
  }

  const phone = normalizeStoredPhone(phoneRaw)
  if (!phone) {
    return { error: "Numărul de telefon nu este valid. Folosește un format românesc, de exemplu 07xx xxx xxx." }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    return { error: formatSupabaseError(authError) }
  }

  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  if (!isEmailConfirmedUser(user)) {
    return { error: "Confirmă adresa de email înainte de a configura clinica." }
  }

  const row = {
    user_id: user.id,
    clinic_name: clinicName,
    therapist_name: therapistName,
    phone,
  }

  // ID-ul nu vine din formular: este preluat exclusiv din sesiunea verificată.
  const { data: existing, error: readError } = await supabase
    .from("clinic_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (readError) {
    return { error: formatSupabaseError(readError) }
  }

  const writeResult = existing
    ? await supabase
        .from("clinic_profiles")
        .update({ clinic_name: clinicName, therapist_name: therapistName, phone })
        .eq("user_id", user.id)
    : await supabase
        .from("clinic_profiles")
        .insert({ ...row, role: "admin" as const })

  if (writeResult.error) {
    return { error: formatSupabaseError(writeResult.error) }
  }

  await supabase.auth.updateUser({
    data: {
      full_name: therapistName,
      clinic_name: clinicName,
      clinic_id: user.id,
      phone,
    },
  })

  revalidatePath("/", "layout")
  return { ok: true }
}
