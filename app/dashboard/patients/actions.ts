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
import { isEnergyLevel, isSleepQuality, type DailyCheckin } from "@/lib/patients/types"
import { composeIntervalExerciseNotes, isDateKey } from "@/lib/exercises/schedule"
import {
  assignedExerciseMatchesInterval,
  normalizeExerciseTitle,
} from "@/lib/exercises/assigned-selection"
import {
  dailyCheckinFromRow,
  fetchTodaysCheckInRow,
  isUniqueCheckinConstraintError,
} from "@/lib/patients/daily-checkin"
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
import { persistClinicalNotesForTherapist } from "@/lib/patients/persist-clinical-notes"
import { upsertPatientNotes } from "@/lib/patients/patient-notes"
import { readPatientIdFromSaveArgs, readPatientRecordId } from "@/lib/patients/patient-id"

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

  const notes = readOptional(formData, "clinical_notes")
  const accessCode = await allocateAccessCode(supabase)
  const basePayload = {
    ...patientTenantPayload(user.id),
    full_name: fullName,
    email,
    phone,
    diagnosis: readOptional(formData, "diagnosis"),
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
  if (notes) {
    const notesClient = await privilegedClinicClient(supabase)
    await upsertPatientNotes(notesClient, String(row.id), notes, { updatedBy: user.id })
  }
  const clinicName = (await clinicNameForUser(supabase, user.id)) || "KinetoFlow"
  const message = patientWhatsAppMessage({ fullName, clinicName, accessCode: code })

  revalidatePath("/dashboard")
  return {
    error: null,
    token,
    patientId: String(row.id),
    accessCode: code,
    phone: typeof row.phone === "string" && row.phone.trim() ? row.phone : phone,
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

  const resolvedPatientId = readPatientRecordId(patientId, formData.get("patient_id"), formData.get("patientId"))
  if (!resolvedPatientId) {
    return { error: "Pacientul nu a fost găsit.", token: null }
  }

  const snapshot = await fetchPatientFileSnapshot(supabase, user.id, resolvedPatientId)
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
  } = {
    full_name: fullName,
    email,
    phone,
    diagnosis: readOptional(formData, "diagnosis"),
  }

  const memberIds = await listClinicMemberUserIds(supabase, user.id)
  const client = await privilegedClinicClient(supabase)

  let update = client.from("patients").update(payload).eq("id", resolvedPatientId).in("therapist_id", memberIds)
  if (!forceOverwrite && expectedUpdatedAt && snapshot.updated_at) {
    update = update.eq("updated_at", snapshot.updated_at)
  }

  const { data, error } = await update.select("id, updated_at")

  if (error || !data || data.length === 0) {
    if (!forceOverwrite && snapshot.updated_at && expectedUpdatedAt) {
      const latest = await fetchPatientFileSnapshot(supabase, user.id, resolvedPatientId)
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
      .eq("id", resolvedPatientId)
      .in("therapist_id", memberIds)
      .select("id, updated_at")

    if (fallback.error) {
      return { error: fallback.error.message, token: null }
    }
    if (!fallback.data || fallback.data.length === 0) {
      return { error: "Nu am putut salva fișa pacientului.", token: null }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/patients/${resolvedPatientId}`)
    const stamp =
      typeof fallback.data[0]?.updated_at === "string" ? fallback.data[0].updated_at : null
    return { error: null, token: null, updatedAt: stamp }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${resolvedPatientId}`)
  const stamp = typeof data[0]?.updated_at === "string" ? data[0].updated_at : null
  return { error: null, token: null, updatedAt: stamp }
}

export type SaveClinicalNotesPayload = {
  patientId?: string | null
  patient_id?: string | null
  id?: string | null
  notes: string
  expectedUpdatedAt?: string | null
  forceOverwrite?: boolean
}

export type SaveClinicalNotesResult = {
  error: string | null
  updated_at?: string | null
  conflict?: boolean
  current?: PatientFileSnapshot | null
  unauthorized?: boolean
}

function readClinicalNotesPayload(
  patient_id: string | SaveClinicalNotesPayload | FormData,
  payload?: SaveClinicalNotesPayload | FormData,
): { patient_id: unknown; notes: unknown; expectedUpdatedAt: unknown; forceOverwrite: boolean } {
  const boundOrObject = patient_id
  const body = payload

  if (boundOrObject instanceof FormData) {
    return {
      patient_id: boundOrObject.get("patient_id") ?? boundOrObject.get("patientId"),
      notes: boundOrObject.get("notes") ?? boundOrObject.get("clinical_notes"),
      expectedUpdatedAt: boundOrObject.get("expectedUpdatedAt") ?? boundOrObject.get("expected_updated_at"),
      forceOverwrite: String(boundOrObject.get("forceOverwrite") ?? boundOrObject.get("force_overwrite") ?? "") === "1",
    }
  }

  if (typeof boundOrObject === "object" && boundOrObject) {
    return {
      patient_id: readPatientIdFromSaveArgs(boundOrObject, body),
      notes: boundOrObject.notes,
      expectedUpdatedAt: boundOrObject.expectedUpdatedAt,
      forceOverwrite: boundOrObject.forceOverwrite === true,
    }
  }

  if (body instanceof FormData) {
    return {
      patient_id: readPatientIdFromSaveArgs(boundOrObject, body),
      notes: body.get("notes") ?? body.get("clinical_notes"),
      expectedUpdatedAt: body.get("expectedUpdatedAt") ?? body.get("expected_updated_at"),
      forceOverwrite: String(body.get("forceOverwrite") ?? body.get("force_overwrite") ?? "") === "1",
    }
  }

  return {
    patient_id: readPatientIdFromSaveArgs(boundOrObject, body),
    notes: body?.notes,
    expectedUpdatedAt: body?.expectedUpdatedAt,
    forceOverwrite: body?.forceOverwrite === true,
  }
}

export async function saveClinicalNotes(
  patient_id: string | SaveClinicalNotesPayload | FormData,
  payload?: SaveClinicalNotesPayload | FormData,
): Promise<SaveClinicalNotesResult> {
  const parsed = readClinicalNotesPayload(patient_id, payload)
  const resolvedPatientId = readPatientIdFromSaveArgs(parsed.patient_id, payload ?? patient_id)
  if (!resolvedPatientId) {
    return { error: "Pacientul nu a fost găsit." }
  }

  if (typeof parsed.notes !== "string") {
    return { error: "Notițele trebuie să fie text." }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", unauthorized: true }
  }

  const result = await persistClinicalNotesForTherapist({
    supabase,
    userId: user.id,
    patientId: resolvedPatientId,
    patient_id: resolvedPatientId,
    notes: parsed.notes,
    expectedUpdatedAt: typeof parsed.expectedUpdatedAt === "string" ? parsed.expectedUpdatedAt : null,
    forceOverwrite: parsed.forceOverwrite,
  })

  if (!result.ok) {
    return {
      error: result.conflict ? null : result.error,
      conflict: result.conflict,
      current: result.current ?? null,
      unauthorized: result.unauthorized,
    }
  }

  return { error: null, updated_at: result.updated_at }
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

  const { data: existingRows, error: existingError } = await client
    .from("exercises")
    .select("id, title, notes")
    .eq("patient_id", patientId)

  if (existingError) {
    return { error: existingError.message, inserted: 0 }
  }

  const existingForInterval = ((existingRows ?? []) as Array<{ id: string; title: string; notes: string | null }>).filter(
    (row) => assignedExerciseMatchesInterval(row.notes, { startDate, endDate }),
  )
  const claimedIds = new Set<string>()
  const toInsert: typeof rows = []
  const toUpdate: Array<{ id: string; video_url: string | null; sets: number | null; reps: number | null; notes: string | null }> =
    []

  for (const row of rows) {
    const titleKey = normalizeExerciseTitle(row.title)
    const match = existingForInterval.find(
      (existing) => !claimedIds.has(existing.id) && normalizeExerciseTitle(existing.title) === titleKey,
    )
    if (match) {
      claimedIds.add(match.id)
      toUpdate.push({
        id: match.id,
        video_url: row.video_url,
        sets: row.sets,
        reps: row.reps,
        notes: row.notes,
      })
    } else {
      toInsert.push(row)
    }
  }

  let saved = 0
  if (toInsert.length > 0) {
    const { data, error } = await client.from("exercises").insert(toInsert).select("id")
    if (error) {
      return { error: error.message, inserted: 0 }
    }
    saved += data?.length ?? toInsert.length
  }

  for (const row of toUpdate) {
    const { error } = await client
      .from("exercises")
      .update({
        video_url: row.video_url,
        sets: row.sets,
        reps: row.reps,
        notes: row.notes,
      })
      .eq("id", row.id)
      .eq("patient_id", patientId)
    if (error) {
      return { error: error.message, inserted: saved }
    }
    saved += 1
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { error: null, inserted: saved }
}

export async function listAssignedExercisesForPatient(
  patientId: string,
): Promise<{ error: string | null; exercises: ExerciseRecord[] }> {
  if (!patientId) {
    return { error: "Pacientul lipsește.", exercises: [] }
  }

  const { supabase, user } = await requireUser()
  if (!user) {
    return { error: "Sesiunea a expirat.", exercises: [] }
  }

  const owned = await getOwnPatientRow(supabase, user.id, patientId, "id")
  if (!owned.data) {
    return { error: "Pacientul nu aparține acestui cabinet.", exercises: [] }
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("id, patient_id, title, video_url, sets, reps, notes")
    .eq("patient_id", patientId)
    .order("title", { ascending: true })

  if (error) {
    return { error: error.message, exercises: [] }
  }

  return { error: null, exercises: (data ?? []) as ExerciseRecord[] }
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

function isMissingColumnError(error: { code?: string; message: string }, column: string): boolean {
  const message = error.message.toLowerCase()
  return error.code === "PGRST204" || message.includes(column.toLowerCase())
}

type InsertCheckInResult =
  | { ok: true }
  | { ok: false; uniqueViolation: true }
  | { ok: false; uniqueViolation: false; error: string }

async function insertCheckInRow(
  admin: Awaited<ReturnType<typeof import("@/utils/supabase/admin").createServiceRoleClient>>,
  row: Record<string, unknown>,
): Promise<InsertCheckInResult> {
  const variants: Array<Record<string, unknown>> = [row]
  const withoutDuration = { ...row }
  delete withoutDuration.exercise_duration_seconds
  variants.push(withoutDuration)
  const withoutEnergy = { ...row }
  delete withoutEnergy.energy_level
  variants.push(withoutEnergy)
  const withoutLocalDate = { ...row }
  delete withoutLocalDate.local_date
  variants.push(withoutLocalDate)
  const core = { ...row }
  delete core.exercise_duration_seconds
  delete core.energy_level
  variants.push(core)

  const seen = new Set<string>()
  for (const attempt of variants) {
    const key = Object.keys(attempt).sort().join(",")
    if (seen.has(key)) {
      continue
    }
    seen.add(key)
    const { error } = await admin.from("check_ins").insert(attempt as never)
    if (!error) {
      return { ok: true }
    }
    if (isUniqueCheckinConstraintError(error)) {
      return { ok: false, uniqueViolation: true }
    }
    const missingOptional =
      isMissingColumnError(error, "exercise_duration_seconds") ||
      isMissingColumnError(error, "energy_level") ||
      isMissingColumnError(error, "local_date")
    if (!missingOptional) {
      return { ok: false, uniqueViolation: false, error: "Nu am putut salva check-in-ul. Încearcă din nou." }
    }
  }

  return { ok: false, uniqueViolation: false, error: "Nu am putut salva check-in-ul. Încearcă din nou." }
}

export type SubmitPatientCheckinResult = {
  error: string | null
  alreadySubmitted?: boolean
  checkin?: DailyCheckin | null
}

export async function submitPatientCheckin(formData: FormData): Promise<SubmitPatientCheckinResult> {
  const token = readOptional(formData, "token")
  const notes = readOptional(formData, "notes")
  const sleepRaw = readOptional(formData, "sleep")
  const energyRaw = readOptional(formData, "energy")
  const energy = isEnergyLevel(energyRaw) ? energyRaw : null
  const completedRaw = readOptional(formData, "completedExerciseIds")
  const completedExerciseIds = completedRaw
    ? completedRaw.split("|").map((id) => id.trim()).filter(Boolean)
    : []
  const sessionStartedAt = readOptional(formData, "sessionStartedAt")
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
  const {
    earliestExerciseCompletionAt,
    listActiveExerciseIdsForDay,
    listCompletedExerciseIdsForDay,
    syncExerciseCompletionsForDay,
  } = await import("@/lib/patients/exercise-completions")
  const { allExercisesCompleted, CHECKIN_REQUIRES_EXERCISES_MESSAGE } = await import(
    "@/lib/patients/checkin-exercises"
  )
  const { computeExerciseDurationSeconds, earliestInstant } = await import(
    "@/lib/patients/session-duration"
  )
  const { bucharestDateKey } = await import("@/lib/time/bucharest")
  const admin = createServiceRoleClient()
  const { data: patient, error: patientError } = await admin
    .from("patients")
    .select("id")
    .eq("token", token)
    .maybeSingle()

  if (patientError || !patient) {
    return { error: "Nu am găsit programul pacientului. Reîncarcă pagina din linkul de acces." }
  }

  const todayKey = bucharestDateKey()
  const existingRow = await fetchTodaysCheckInRow(admin, patient.id, todayKey)
  if (existingRow) {
    if (completedExerciseIds.length > 0) {
      await syncExerciseCompletionsForDay({
        supabase: admin,
        patientId: patient.id,
        exerciseIds: completedExerciseIds,
        completedOn: todayKey,
      })
    }
    const completedToday = await listCompletedExerciseIdsForDay(admin, patient.id, todayKey)
    return {
      error: null,
      alreadySubmitted: true,
      checkin: dailyCheckinFromRow(existingRow, todayKey, completedToday),
    }
  }

  const activeExerciseIds = await listActiveExerciseIdsForDay(admin, patient.id, todayKey)
  if (activeExerciseIds === null) {
    return { error: "Nu am putut verifica exercițiile de azi. Încearcă din nou." }
  }
  const completedToday = await listCompletedExerciseIdsForDay(admin, patient.id, todayKey)
  if (!allExercisesCompleted(activeExerciseIds, completedToday)) {
    return { error: CHECKIN_REQUIRES_EXERCISES_MESSAGE }
  }

  const firstCompletionAt = await earliestExerciseCompletionAt(admin, patient.id, todayKey)
  const sessionStart = earliestInstant(sessionStartedAt, firstCompletionAt)
  const exerciseDurationSeconds =
    activeExerciseIds.length === 0 ? null : computeExerciseDurationSeconds(sessionStart)

  const base = {
    patient_id: patient.id,
    vas_score: vasScore,
    sleep_quality: sleepQuality,
    notes,
  }

  const insertResult = await insertCheckInRow(admin, {
    ...base,
    local_date: todayKey,
    energy_level: energy,
    exercise_duration_seconds: exerciseDurationSeconds,
  })

  if (!insertResult.ok && insertResult.uniqueViolation) {
    const firstRow = await fetchTodaysCheckInRow(admin, patient.id, todayKey)
    const completedToday = await listCompletedExerciseIdsForDay(admin, patient.id, todayKey)
    return {
      error: null,
      alreadySubmitted: true,
      checkin: firstRow ? dailyCheckinFromRow(firstRow, todayKey, completedToday) : null,
    }
  }

  if (!insertResult.ok) {
    return { error: insertResult.error }
  }

  if (completedExerciseIds.length > 0) {
    await syncExerciseCompletionsForDay({
      supabase: admin,
      patientId: patient.id,
      exerciseIds: completedExerciseIds,
      completedOn: todayKey,
    })
  }

  return { error: null, alreadySubmitted: false }
}

