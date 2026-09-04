"use server"

import { revalidatePath } from "next/cache"

import { normalizeStoredPhone } from "@/lib/patients/phone"
import { formatSupabaseError } from "@/lib/supabase/format-error"
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
