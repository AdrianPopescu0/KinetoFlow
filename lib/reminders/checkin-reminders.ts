import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isExerciseActiveOnDate } from "@/lib/exercises/schedule"
import { sendPatientNotification } from "@/lib/patients/notify-patient"
import { patientCheckinReminderMessage } from "@/lib/patients/whatsapp"
import {
  bucharestDateKey,
  startOfTodayIso,
  startOfTomorrowIso,
} from "@/lib/time/bucharest"

type PatientRow = {
  id: string
  full_name: string
  phone: string | null
  access_code: string | null
  therapist_id: string
  assigned_therapist_id: string | null
}

type ExerciseRow = {
  patient_id: string
  notes: string | null
}

type ClinicProfileRow = {
  user_id: string
  clinic_name: string | null
}

export type ReminderSendOutcome = {
  patientId: string
  fullName: string
  status: "sent" | "skipped" | "failed"
  reason?: string
  channel?: "whatsapp" | "sms" | null
  provider?: string | null
}

export type CheckinReminderSummary = {
  dateKey: string
  scanned: number
  eligible: number
  sent: number
  failed: number
  skipped: number
  outcomes: ReminderSendOutcome[]
}

function clinicNameForPatient(
  patient: PatientRow,
  clinicsByUserId: Map<string, string>,
): string {
  const assigned = patient.assigned_therapist_id
    ? clinicsByUserId.get(patient.assigned_therapist_id)
    : undefined
  if (assigned) {
    return assigned
  }
  return clinicsByUserId.get(patient.therapist_id) || "KinetoFlow"
}

export async function runCheckinReminders(
  supabase: SupabaseClient,
  options: { dryRun?: boolean; now?: Date } = {},
): Promise<CheckinReminderSummary> {
  const now = options.now ?? new Date()
  const dateKey = bucharestDateKey(now)
  const todayStart = startOfTodayIso(now)
  const tomorrowStart = startOfTomorrowIso(now)

  const { data: patientsRaw, error: patientsError } = await supabase
    .from("patients")
    .select("id, full_name, phone, access_code, therapist_id, assigned_therapist_id")

  if (patientsError) {
    throw new Error(`Nu am putut citi pacienții: ${patientsError.message}`)
  }

  const patients = (patientsRaw ?? []) as PatientRow[]
  if (patients.length === 0) {
    return {
      dateKey,
      scanned: 0,
      eligible: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      outcomes: [],
    }
  }

  const patientIds = patients.map((patient) => patient.id)

  const [{ data: exercisesRaw, error: exercisesError }, { data: checkInsRaw, error: checkInsError }] =
    await Promise.all([
      supabase.from("exercises").select("patient_id, notes").in("patient_id", patientIds),
      supabase
        .from("check_ins")
        .select("patient_id")
        .in("patient_id", patientIds)
        .gte("created_at", todayStart)
        .lt("created_at", tomorrowStart),
    ])

  if (exercisesError) {
    throw new Error(`Nu am putut citi exercițiile: ${exercisesError.message}`)
  }
  if (checkInsError) {
    throw new Error(`Nu am putut citi check-in-urile: ${checkInsError.message}`)
  }

  const exercises = (exercisesRaw ?? []) as ExerciseRow[]
  const checkedInToday = new Set(
    (checkInsRaw ?? [])
      .map((row) => (typeof row.patient_id === "string" ? row.patient_id : null))
      .filter((id): id is string => Boolean(id)),
  )

  const activePatientIds = new Set<string>()
  for (const exercise of exercises) {
    if (!exercise.patient_id) {
      continue
    }
    if (isExerciseActiveOnDate(exercise.notes, dateKey)) {
      activePatientIds.add(exercise.patient_id)
    }
  }

  const therapistIds = [
    ...new Set(
      patients.flatMap((patient) =>
        [patient.therapist_id, patient.assigned_therapist_id].filter(
          (id): id is string => typeof id === "string" && id.length > 0,
        ),
      ),
    ),
  ]

  const clinicsByUserId = new Map<string, string>()
  if (therapistIds.length > 0) {
    const { data: profilesRaw } = await supabase
      .from("clinic_profiles")
      .select("user_id, clinic_name")
      .in("user_id", therapistIds)

    for (const row of (profilesRaw ?? []) as ClinicProfileRow[]) {
      const name = String(row.clinic_name ?? "").trim()
      if (row.user_id && name) {
        clinicsByUserId.set(row.user_id, name)
      }
    }
  }

  const outcomes: ReminderSendOutcome[] = []
  let sent = 0
  let failed = 0
  let skipped = 0
  let eligible = 0

  for (const patient of patients) {
    if (!activePatientIds.has(patient.id)) {
      skipped += 1
      continue
    }

    if (checkedInToday.has(patient.id)) {
      skipped += 1
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Check-in deja făcut azi.",
      })
      continue
    }

    const phone = typeof patient.phone === "string" ? patient.phone.trim() : ""
    const accessCode = typeof patient.access_code === "string" ? patient.access_code.trim() : ""

    if (!phone) {
      skipped += 1
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Lipsește telefonul.",
      })
      continue
    }

    if (!/^\d{8}$/.test(accessCode)) {
      skipped += 1
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Cod de acces invalid.",
      })
      continue
    }

    eligible += 1
    const clinicName = clinicNameForPatient(patient, clinicsByUserId)
    const message = patientCheckinReminderMessage({
      fullName: patient.full_name,
      clinicName,
      accessCode,
    })

    if (options.dryRun) {
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "dry-run",
      })
      continue
    }

    const result = await sendPatientNotification(phone, message)
    if (result.sent) {
      sent += 1
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "sent",
        channel: result.channel,
        provider: result.provider,
      })
    } else {
      failed += 1
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "failed",
        reason: result.error ?? "Trimitere eșuată.",
        channel: result.channel,
        provider: result.provider,
      })
    }
  }

  return {
    dateKey,
    scanned: patients.length,
    eligible,
    sent,
    failed,
    skipped,
    outcomes,
  }
}
