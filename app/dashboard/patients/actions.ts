"use server"

import { revalidatePath } from "next/cache"

import { createClient } from "@/utils/supabase/server"
import {
  clinicNameForUser,
  listClinicMemberUserIds,
  privilegedClinicClient,
} from "@/lib/clinics/members"
import { generateAccessCode, isAccessCode } from "@/lib/patients/access-code"
import { normalizeStoredPhone } from "@/lib/patients/phone"
import { getOwnPatientRow, patientTenantPayload } from "@/lib/patients/tenant"
import { isEnergyLevel, isSleepQuality } from "@/lib/patients/types"
import { composeIntervalExerciseNotes, isDateKey } from "@/lib/exercises/schedule"
import { startOfTodayIso, startOfTomorrowIso } from "@/lib/time/bucharest"
import {
  patientAccessUrl,
  patientWhatsAppHref,
  patientWhatsAppMessage,
  patientWhatsAppWebHref,
} from "@/lib/patients/whatsapp"

import type { ExerciseRecord } from "@/lib/patients/types-db"
import {
  fetchPatientFileSnapshot,
  isWriteConflict,
  type PatientFileSnapshot,
} from "@/lib/patients/optimistic"

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
  conflict?: boolean
  current?: PatientFileSnapshot | null
  updatedAt?: string | null
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
  const clinicName = (await clinicNameForUser(supabase, user.id)) || "KinetoFlow"
  const message = patientWhatsAppMessage({ fullName, clinicName, accessCode: code })

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

  const expectedUpdatedAt = readOptional(formData, "expected_updated_at")
  const forceOverwrite = String(formData.get("force_overwrite") ?? "") === "1"

  const snapshot = await fetchPatientFileSnapshot(supabase, user.id, patientId)
  if (!snapshot) {
    return { error: "Pacientul nu a fost găsit.", token: null }
  }

  if (!forceOverwrite && isWriteConflict(expectedUpdatedAt, snapshot.updated_at)) {
    return { error: null, token: null, conflict: true, current: snapshot }
  }

  const payload: {
    full_name: string
    email: string | null
    phone: string
    diagnosis: string | null
    clinical_notes?: string | null
  } = {
    full_name: fullName,
    email,
    phone,
    diagnosis: readOptional(formData, "diagnosis"),
  }
  if (formData.has("clinical_notes")) {
    payload.clinical_notes = readOptional(formData, "clinical_notes")
  }

  const memberIds = await listClinicMemberUserIds(supabase, user.id)
  const client = await privilegedClinicClient(supabase)

  let update = client.from("patients").update(payload).eq("id", patientId).in("therapist_id", memberIds)
  if (!forceOverwrite && expectedUpdatedAt && snapshot.updated_at) {
    update = update.eq("updated_at", snapshot.updated_at)
  }

  const { data, error } = await update.select("id, updated_at")

  if (error || !data || data.length === 0) {
    if (!forceOverwrite && snapshot.updated_at && expectedUpdatedAt) {
      const latest = await fetchPatientFileSnapshot(supabase, user.id, patientId)
      if (latest && isWriteConflict(expectedUpdatedAt, latest.updated_at)) {
        return { error: null, token: null, conflict: true, current: latest }
      }
    }

    const fallback = await client
      .from("patients")
      .update({
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone,
        diagnosis: payload.diagnosis,
      })
      .eq("id", patientId)
      .in("therapist_id", memberIds)
      .select("id, updated_at")

    if (fallback.error) {
      return { error: fallback.error.message, token: null }
    }
    if (!fallback.data || fallback.data.length === 0) {
      return { error: "Nu am putut salva fișa pacientului.", token: null }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/patients/${patientId}`)
    const stamp =
      typeof fallback.data[0]?.updated_at === "string" ? fallback.data[0].updated_at : null
    return { error: null, token: null, updatedAt: stamp }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  const stamp = typeof data[0]?.updated_at === "string" ? data[0].updated_at : null
  return { error: null, token: null, updatedAt: stamp }
}

export async function assignPatientTherapist(
  patientId: string,
  targetUserId: string | null,
): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const client = await privilegedClinicClient(supabase)
  const payload: { assigned_therapist_id: string | null; therapist_id?: string } = targetUserId
    ? { assigned_therapist_id: targetUserId, therapist_id: targetUserId }
    : { assigned_therapist_id: null }

  const { data, error } = await client
    .from("patients")
    .update(payload)
    .eq("id", patientId)
    .select("id, assigned_therapist_id")

  if (error) {
    return { error: error.message }
  }

  if (!data || data.length === 0) {
    return {
      error: "Update-ul nu a atins niciun rând. Verifică dacă pacientul mai există în baza de date.",
    }
  }

  // Fără revalidatePath: tabelul se actualizează optimist pe client, iar /dashboard
  // e rută dinamică (citește cookie-urile de sesiune), deci reîncarcă date proaspete.
  return { error: null }
}

export async function deletePatient(patientId: string): Promise<{ error: string | null }> {
  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const memberIds = await listClinicMemberUserIds(supabase, user.id)
  const client = await privilegedClinicClient(supabase)
  const { data, error } = await client
    .from("patients")
    .delete()
    .eq("id", patientId)
    .in("therapist_id", memberIds)
    .select("id")

  if (error) {
    return { error: error.message }
  }
  if (!data || data.length === 0) {
    return { error: "Pacientul nu a fost șters. Nu aparține acestui cabinet." }
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

export type AssignableExerciseInput = {
  title: string
  videoUrl?: string | null
  sets?: number | null
  reps?: number | null
  description?: string | null
}

export async function assignExercisesBatch(
  patientId: string,
  exercises: AssignableExerciseInput[],
  interval: { startDate: string; endDate: string },
): Promise<{ error: string | null; inserted: number }> {
  if (!patientId || exercises.length === 0) {
    return { error: "Selectează cel puțin un exercițiu.", inserted: 0 }
  }

  const { startDate, endDate } = interval
  if (!isDateKey(startDate) || !isDateKey(endDate) || startDate > endDate) {
    return { error: "Alege un interval de tratament valid.", inserted: 0 }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat.", inserted: 0 }
  }

  const owned = await getOwnPatientRow(supabase, user.id, patientId, "id, full_name")
  if (!owned.data) {
    return { error: "Pacientul nu aparține acestui cabinet.", inserted: 0 }
  }

  const client = await privilegedClinicClient(supabase)
  const rows = exercises
    .map((exercise) => {
      const title = exercise.title.trim()
      if (!title) {
        return null
      }
      return {
        patient_id: patientId,
        title,
        video_url: exercise.videoUrl?.trim() || null,
        sets: typeof exercise.sets === "number" && Number.isFinite(exercise.sets) ? exercise.sets : null,
        reps: typeof exercise.reps === "number" && Number.isFinite(exercise.reps) ? exercise.reps : null,
        notes: composeIntervalExerciseNotes(String(exercise.description ?? ""), startDate, endDate),
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  if (rows.length === 0) {
    return { error: "Niciun exercițiu valid de salvat.", inserted: 0 }
  }

  const { data, error } = await client.from("exercises").insert(rows).select("id")
  if (error) {
    return { error: error.message, inserted: 0 }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null, inserted: data?.length ?? rows.length }
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
  const energyRaw = readOptional(formData, "energy")
  const energy = isEnergyLevel(energyRaw) ? energyRaw : null
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

  const { data: existing } = await admin
    .from("check_ins")
    .select("id, created_at")
    .eq("patient_id", patient.id)
    .gte("created_at", startOfTodayIso())
    .lt("created_at", startOfTomorrowIso())
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: null }
  }

  const base: Record<string, unknown> = {
    patient_id: patient.id,
    vas_score: vasScore,
    sleep_quality: sleepQuality,
    notes,
  }

  const { error: insertError } = await admin
    .from("check_ins")
    .insert(energy ? { ...base, energy_level: energy } : base)

  if (insertError) {
    // Fără migrarea 014, coloana energy_level lipsește: salvăm restul check-in-ului.
    const missingColumn =
      insertError.code === "PGRST204" || insertError.message.toLowerCase().includes("energy_level")
    if (!energy || !missingColumn) {
      return { error: "Nu am putut salva check-in-ul. Încearcă din nou." }
    }

    const retry = await admin.from("check_ins").insert(base)
    if (retry.error) {
      return { error: "Nu am putut salva check-in-ul. Încearcă din nou." }
    }
  }

  return { error: null }
}
