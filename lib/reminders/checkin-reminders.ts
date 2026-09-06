import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isExerciseActiveOnDate } from "@/lib/exercises/schedule"
import { parseNotifyChannel } from "@/lib/patients/notify-channel"
import { sendPatientNotification } from "@/lib/patients/notify-patient"
import { toWhatsAppNumber } from "@/lib/patients/phone"
import { isMissingNotifyChannelColumn } from "@/lib/patients/remember-notify-channel"
import { patientCheckinReminderMessage } from "@/lib/patients/whatsapp"
import { maskPhone, providerFlags, reminderLog, reminderWarn } from "@/lib/reminders/log"
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
  notify_channel?: string | null
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
  const providers = providerFlags()

  reminderLog("Pornesc scanarea reminder-elor de check-in.", {
    dateKey,
    dryRun: Boolean(options.dryRun),
    nowIso: now.toISOString(),
    todayStart,
    tomorrowStart,
    providers,
  })

  const withChannel = await supabase
    .from("patients")
    .select("id, full_name, phone, access_code, therapist_id, assigned_therapist_id, notify_channel")

  const patientsQuery = isMissingNotifyChannelColumn(withChannel.error)
    ? await supabase
        .from("patients")
        .select("id, full_name, phone, access_code, therapist_id, assigned_therapist_id")
    : withChannel

  if (patientsQuery.error) {
    throw new Error(`Nu am putut citi pacienții: ${patientsQuery.error.message}`)
  }

  const patients = (patientsQuery.data ?? []) as PatientRow[]
  if (isMissingNotifyChannelColumn(withChannel.error)) {
    reminderWarn("Coloana notify_channel lipsește. Rulează sql/022_patient_notify_channel.sql.")
  }
  if (patients.length === 0) {
    reminderWarn("Nu există pacienți în baza de date. Nu trimit nimic.")
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

  reminderLog("Context încărcat.", {
    scanned: patients.length,
    activePatients: activePatientIds.size,
    checkedInToday: checkedInToday.size,
  })

  for (const patient of patients) {
    const phone = typeof patient.phone === "string" ? patient.phone.trim() : ""
    const accessCode = typeof patient.access_code === "string" ? patient.access_code.trim() : ""
    const channel = parseNotifyChannel(patient.notify_channel)
    const base = {
      patientId: patient.id,
      fullName: patient.full_name,
      phone: maskPhone(phone),
      notifyChannel: patient.notify_channel ?? null,
    }

    if (!activePatientIds.has(patient.id)) {
      skipped += 1
      reminderLog("Sărit: fără exercițiu activ azi.", base)
      continue
    }

    if (checkedInToday.has(patient.id)) {
      skipped += 1
      reminderLog("Sărit: check-in deja făcut azi.", base)
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Check-in deja făcut azi.",
      })
      continue
    }

    if (!phone) {
      skipped += 1
      reminderWarn("Sărit: lipsește telefonul.", base)
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Lipsește telefonul.",
      })
      continue
    }

    if (!toWhatsAppNumber(phone)) {
      skipped += 1
      reminderWarn("Sărit: număr de telefon invalid (nu se poate normaliza).", base)
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Număr de telefon invalid.",
      })
      continue
    }

    if (!/^\d{8}$/.test(accessCode)) {
      skipped += 1
      reminderWarn("Sărit: cod de acces invalid.", { ...base, accessCodeLength: accessCode.length })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Cod de acces invalid.",
      })
      continue
    }

    if (!channel) {
      skipped += 1
      reminderWarn("Sărit: canal de notificare nesetat (WhatsApp sau SMS).", base)
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "Canal de notificare nesetat. Trimite invitația pe WhatsApp sau SMS.",
      })
      continue
    }

    const channelReady = channel === "whatsapp" ? providers.twilioWhatsApp || providers.metaWhatsApp : providers.twilioSms
    if (!channelReady) {
      reminderWarn("Canal ales, dar furnizorul nu e configurat.", {
        ...base,
        channel,
        providers,
      })
    }

    eligible += 1
    const clinicName = clinicNameForPatient(patient, clinicsByUserId)
    const message = patientCheckinReminderMessage({
      fullName: patient.full_name,
      clinicName,
      accessCode,
    })

    if (options.dryRun) {
      reminderLog("Dry-run: aș trimite, dar nu trimit.", { ...base, channel, message })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "dry-run",
        channel,
      })
      continue
    }

    reminderLog("Trimit reminder.", { ...base, channel, clinicName, message })
    const result = await sendPatientNotification(phone, message, channel)
    if (result.sent) {
      sent += 1
      reminderLog("Trimis.", { ...base, channel: result.channel, provider: result.provider, message })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "sent",
        channel: result.channel,
        provider: result.provider,
      })
    } else {
      failed += 1
      reminderWarn("Trimitere eșuată (telefon / canal / furnizor).", {
        ...base,
        channel: result.channel ?? channel,
        provider: result.provider,
        error: result.error ?? "Trimitere eșuată.",
        providers,
        message,
      })
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

  reminderLog("Scanare încheiată.", {
    dateKey,
    scanned: patients.length,
    eligible,
    sent,
    failed,
    skipped,
  })

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
