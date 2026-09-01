"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"

export type CreatePatientState = {
  error: string | null
  token: string | null
}

function readOptional(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function createPatient(formData: FormData): Promise<CreatePatientState> {
  const fullName = readOptional(formData, "full_name")
  const email = readOptional(formData, "email")
  const phone = readOptional(formData, "phone")
  const diagnosis = readOptional(formData, "diagnosis")

  if (!fullName) {
    return { error: "Numele complet este obligatoriu.", token: null }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", token: null }
  }

  const { data, error } = await supabase
    .from("patients")
    .insert({
      therapist_id: user.id,
      full_name: fullName,
      email,
      phone,
      diagnosis,
    })
    .select("token")
    .single()

  if (error || !data) {
    const needsMigration =
      error?.message.includes("schema cache") ||
      error?.message.includes("does not exist") ||
      error?.code === "PGRST205"

    return {
      error: needsMigration
        ? "Tabela patients lipsește. Rulează migrarea SQL din supabase/migrations/001_patients.sql."
        : "Nu am putut salva pacientul. Verifică datele și încearcă din nou.",
      token: null,
    }
  }

  revalidatePath("/dashboard")
  return { error: null, token: data.token as string }
}
