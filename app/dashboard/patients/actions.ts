"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/utils/supabase/server"
import { isSleepQuality } from "@/lib/patients/types"

export type MutationState = {
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

function readNumber(formData: FormData, key: string): number | null {
  const raw = readOptional(formData, key)
  if (!raw) {
    return null
  }
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : null
}

async function requireUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createPatient(formData: FormData): Promise<MutationState> {
  const fullName = readOptional(formData, "full_name")
  if (!fullName) {
    return { error: "Numele complet este obligatoriu.", token: null }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", token: null }
  }

  const payload = {
    therapist_id: user.id,
    full_name: fullName,
    email: readOptional(formData, "email"),
    phone: readOptional(formData, "phone"),
    diagnosis: readOptional(formData, "diagnosis"),
    clinical_notes: readOptional(formData, "clinical_notes"),
  }

  const insert = await supabase.from("patients").insert(payload).select("token").single()
  if (insert.error) {
    const withoutNotes = await supabase
      .from("patients")
      .insert({
        therapist_id: payload.therapist_id,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        diagnosis: payload.diagnosis,
      })
      .select("token")
      .single()

    if (withoutNotes.error || !withoutNotes.data) {
      return {
        error: "Nu am putut salva pacientul. Verifică datele sau rulează migrarea SQL.",
        token: null,
      }
    }

    revalidatePath("/dashboard")
    return { error: null, token: withoutNotes.data.token as string }
  }

  revalidatePath("/dashboard")
  return { error: null, token: insert.data?.token as string }
}

export async function updatePatient(patientId: string, formData: FormData): Promise<MutationState> {
  const fullName = readOptional(formData, "full_name")
  if (!fullName) {
    return { error: "Numele complet este obligatoriu.", token: null }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat.", token: null }
  }

  const { error } = await supabase
    .from("patients")
    .update({
      full_name: fullName,
      email: readOptional(formData, "email"),
      phone: readOptional(formData, "phone"),
      diagnosis: readOptional(formData, "diagnosis"),
      clinical_notes: readOptional(formData, "clinical_notes"),
    })
    .eq("id", patientId)

  if (error) {
    await supabase
      .from("patients")
      .update({
        full_name: fullName,
        email: readOptional(formData, "email"),
        phone: readOptional(formData, "phone"),
        diagnosis: readOptional(formData, "diagnosis"),
      })
      .eq("id", patientId)
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null, token: null }
}

export async function deletePatient(patientId: string): Promise<void> {
  const { supabase, user } = await requireUser()
  if (!user) {
    redirect("/login")
  }

  await supabase.from("patients").delete().eq("id", patientId)
  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function addExercise(patientId: string, formData: FormData): Promise<MutationState> {
  const title = readOptional(formData, "title")
  if (!title) {
    return { error: "Titlul exercițiului este obligatoriu.", token: null }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat.", token: null }
  }

  const { error } = await supabase.from("exercises").insert({
    patient_id: patientId,
    title,
    video_url: readOptional(formData, "video_url"),
    sets: readNumber(formData, "sets"),
    reps: readNumber(formData, "reps"),
    notes: readOptional(formData, "instructions"),
  })

  if (error) {
    return { error: "Nu am putut adăuga exercițiul.", token: null }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null, token: null }
}

export async function deleteExercise(patientId: string, exerciseId: string): Promise<void> {
  const { supabase, user } = await requireUser()
  if (!user) {
    return
  }

  await supabase.from("exercises").delete().eq("id", exerciseId)
  revalidatePath(`/dashboard/patients/${patientId}`)
}

export async function submitPatientCheckin(formData: FormData): Promise<{ error: string | null }> {
  const token = readOptional(formData, "token")
  const notes = readOptional(formData, "notes")
  const sleepRaw = readOptional(formData, "sleep")
  const vasScore = Number.parseInt(String(formData.get("vas") ?? ""), 10)

  if (
    !token ||
    !isSleepQuality(sleepRaw) ||
    !Number.isInteger(vasScore) ||
    vasScore < 0 ||
    vasScore > 10
  ) {
    return { error: "Completează durerea și calitatea somnului." }
  }

  const sleepQuality: "odihnitor" | "moderat" | "intrerupt" = sleepRaw

  const { createServiceRoleClient } = await import("@/utils/supabase/admin")
  const admin = createServiceRoleClient()
  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id")
    .eq("token", token)
    .maybeSingle()

  if (patientError || !patient) {
    return { error: null }
  }

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date())

  const { data: existing } = await admin
    .from("check_ins")
    .select("id, created_at")
    .eq("patient_id", patient.id)
    .gte("created_at", `${today}T00:00:00.000+03:00`)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: null }
  }

  const { error: insertError } = await admin.from("check_ins").insert({
    patient_id: patient.id,
    vas_score: vasScore,
    sleep_quality: sleepQuality,
    notes,
  })

  if (insertError) {
    return { error: "Nu am putut salva check-in-ul. Încearcă din nou." }
  }

  return { error: null }
}
