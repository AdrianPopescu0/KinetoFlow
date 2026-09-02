"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import { generateAccessCode, isAccessCode } from "@/lib/patients/access-code"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { getOwnPatientRow, patientTenantPayload } from "@/lib/patients/tenant"
import { isSleepQuality } from "@/lib/patients/types"
import {
  patientAccessUrl,
  patientWhatsAppHref,
  patientWhatsAppMessage,
  patientWhatsAppWebHref,
} from "@/lib/patients/whatsapp"

import type { ExerciseRecord } from "@/lib/patients/types-db"

export type MutationState = {
  error: string | null
  token: string | null
  patientId?: string | null
  accessCode?: string | null
  phone?: string | null
  fullName?: string | null
  portalUrl?: string | null
  whatsappHref?: string | null
  whatsappWebHref?: string | null
  whatsappMessage?: string | null
  exercise?: ExerciseRecord | null
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

  const phoneRaw = readOptional(formData, "phone")
  const phone = phoneRaw ? normalizeStoredPhone(phoneRaw) : null
  if (!phone) {
    return { error: "Numărul de telefon este obligatoriu (format 07xx sau +40).", token: null }
  }

  const email = readOptional(formData, "email")
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email-ul nu pare valid. Lasă câmpul gol dacă nu îl folosești.", token: null }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", token: null }
  }

  const accessCode = await allocateAccessCode(supabase)
  const basePayload = {
    ...patientTenantPayload(user.id),
    full_name: fullName,
    email,
    phone,
    diagnosis: readOptional(formData, "diagnosis"),
    clinical_notes: readOptional(formData, "clinical_notes"),
    access_code: accessCode,
  }

  const insert = await supabase.from("patients").insert(basePayload).select("id, token, access_code, phone, full_name").single()
  let row = insert.data
  if (insert.error || !row) {
    const withoutNotes = await supabase
      .from("patients")
      .insert({
        ...patientTenantPayload(user.id),
        full_name: basePayload.full_name,
        email: basePayload.email,
        phone: basePayload.phone,
        diagnosis: basePayload.diagnosis,
        access_code: basePayload.access_code,
      })
      .select("id, token, access_code, phone, full_name")
      .single()

    if (withoutNotes.error || !withoutNotes.data) {
      const legacy = await supabase
        .from("patients")
        .insert({
          therapist_id: user.id,
          full_name: basePayload.full_name,
          email: basePayload.email,
          phone: basePayload.phone,
          diagnosis: basePayload.diagnosis,
          access_code: basePayload.access_code,
        })
        .select("id, token, access_code, phone, full_name")
        .single()

      if (legacy.error || !legacy.data) {
        return {
          error: legacy.error?.message ?? withoutNotes.error?.message ?? insert.error?.message ?? "Nu am putut salva pacientul.",
          token: null,
        }
      }
      row = legacy.data
    } else {
      row = withoutNotes.data
    }
  }

  const token = String(row.token)
  const code = typeof row.access_code === "string" ? row.access_code : accessCode
  const message = patientWhatsAppMessage({ fullName, token, accessCode: code })

  revalidatePath("/dashboard")
  return {
    error: null,
    token,
    patientId: String(row.id),
    accessCode: code,
    phone,
    fullName,
    portalUrl: patientAccessUrl(),
    whatsappHref: patientWhatsAppHref(phone, message),
    whatsappWebHref: patientWhatsAppWebHref(phone, message),
    whatsappMessage: message,
  }
}

async function allocateAccessCode(supabase: Awaited<ReturnType<typeof requireUser>>["supabase"]): Promise<string> {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const code = generateAccessCode()
    if (!isAccessCode(code)) {
      continue
    }
    const { data } = await supabase.from("patients").select("id").eq("access_code", code).maybeSingle()
    if (!data) {
      return code
    }
  }
  return generateAccessCode()
}

export async function updatePatient(patientId: string, formData: FormData): Promise<MutationState> {
  const fullName = readOptional(formData, "full_name")
  if (!fullName) {
    return { error: "Numele complet este obligatoriu.", token: null }
  }

  const phoneRaw = readOptional(formData, "phone")
  const phone = phoneRaw ? normalizeStoredPhone(phoneRaw) : null
  if (!phone) {
    return { error: "Numărul de telefon este obligatoriu (format 07xx sau +40).", token: null }
  }

  const email = readOptional(formData, "email")
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Email-ul nu pare valid. Lasă câmpul gol dacă nu îl folosești.", token: null }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat.", token: null }
  }

  const { error } = await supabase
    .from("patients")
    .update({
      full_name: fullName,
      email,
      phone,
      diagnosis: readOptional(formData, "diagnosis"),
      clinical_notes: readOptional(formData, "clinical_notes"),
    })
    .eq("id", patientId)
    .eq("user_id", user.id)

  if (error) {
    await supabase
      .from("patients")
      .update({
        full_name: fullName,
        email,
        phone,
        diagnosis: readOptional(formData, "diagnosis"),
      })
      .eq("id", patientId)
      .eq("therapist_id", user.id)
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null, token: null }
}

export async function deletePatient(patientId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const { data, error } = await supabase
    .from("patients")
    .delete()
    .eq("id", patientId)
    .eq("user_id", user.id)
    .select("id")

  if (error) {
    const fallback = await supabase
      .from("patients")
      .delete()
      .eq("id", patientId)
      .eq("therapist_id", user.id)
      .select("id")
    if (fallback.error) {
      return { error: fallback.error.message }
    }
    if (!fallback.data || fallback.data.length === 0) {
      return { error: "Pacientul nu a fost șters. Nu aparține acestui cabinet." }
    }
  } else if (!data || data.length === 0) {
    return { error: "Pacientul nu a fost șters. Verifică dacă ești autentificat și dacă politica DELETE este activă." }
  }

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/patients")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null }
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

  const owned = await getOwnPatientRow(supabase, user.id, patientId, "id")
  if (!owned.data) {
    return { error: "Pacientul nu aparține acestui cabinet.", token: null }
  }

  const payload = {
    patient_id: patientId,
    title,
    video_url: readOptional(formData, "video_url"),
    sets: readNumber(formData, "sets"),
    reps: readNumber(formData, "reps"),
    notes: readOptional(formData, "instructions"),
  }

  const { data, error } = await supabase
    .from("exercises")
    .insert(payload)
    .select("id, patient_id, title, video_url, sets, reps, notes")
    .single()

  if (error || !data) {
    return { error: error?.message ?? "Nu am putut adăuga exercițiul.", token: null }
  }

  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null, token: null, exercise: data as ExerciseRecord }
}

export async function deleteExercise(patientId: string, exerciseId: string): Promise<void> {
  const { supabase, user } = await requireUser()
  if (!user) {
    return
  }

  const owned = await getOwnPatientRow(supabase, user.id, patientId, "id")
  if (!owned.data) {
    return
  }

  await supabase.from("exercises").delete().eq("id", exerciseId).eq("patient_id", patientId)
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
