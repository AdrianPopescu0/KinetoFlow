"use server"

import { revalidatePath } from "next/cache"

import { fetchClinicProfile } from "@/lib/clinics/profile"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { createClient } from "@/utils/supabase/server"

export type OnboardingState = {
  error?: string
  ok?: boolean
} | null

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
  const therapistFullName = readRequired(formData, "therapist_full_name")
  const phoneRaw = readRequired(formData, "contact_phone")

  if (!clinicName) {
    return { error: "Introdu numele clinicii sau al cabinetului." }
  }
  if (!therapistFullName) {
    return { error: "Introdu numele și prenumele terapeutului." }
  }
  if (!phoneRaw) {
    return { error: "Introdu telefonul / WhatsApp al clinicii." }
  }

  const contactPhone = normalizeStoredPhone(phoneRaw)
  if (!contactPhone) {
    return { error: "Numărul de telefon nu este valid. Folosește un format românesc, de exemplu 07xx xxx xxx." }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const existing = await fetchClinicProfile(supabase, user.id)
  if (existing.tableMissing) {
    return {
      error:
        "Tabela clinic_profiles lipsește. Rulează `supabase/migrations/004_clinic_profiles.sql` în SQL Editor.",
    }
  }

  const fields = {
    clinic_name: clinicName,
    therapist_full_name: therapistFullName,
    contact_phone: contactPhone,
    updated_at: new Date().toISOString(),
  }

  const { error } = existing.profile
    ? await supabase.from("clinic_profiles").update(fields).eq("id", user.id)
    : await supabase.from("clinic_profiles").insert({ id: user.id, ...fields })

  if (error) {
    return { error: error.message }
  }

  await supabase.auth.updateUser({
    data: {
      full_name: therapistFullName,
      clinic_name: clinicName,
      phone: contactPhone,
    },
  })

  revalidatePath("/", "layout")
  return { ok: true }
}
