import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isExerciseActiveOnDate } from "@/lib/exercises/schedule"
import { resolveNotifyChannel } from "@/lib/patients/notify-channel"
import { sendPatientNotification } from "@/lib/patients/notify-patient"
import { sendPushToTokens } from "@/lib/patients/push-send"
import { listPushTokensByPatientIds } from "@/lib/patients/push-tokens"
import { chooseReminderDelivery } from "@/lib/patients/reminder-delivery"
import { twilioSmsFrom } from "@/lib/patients/sms-send"
import { toWhatsAppNumber } from "@/lib/patients/phone"
import { isMissingNotifyChannelColumn } from "@/lib/patients/remember-notify-channel"
import {
  patientAccessUrlWithCode,
  patientCheckinReminderMessage,
  patientPortalUrl,
} from "@/lib/patients/whatsapp"
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
  token?: string | null
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
  channel?: "sms" | "whatsapp" | "push" | null
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
    smsFromReady: Boolean(twilioSmsFrom()),
    fcmReady: providers.fcm,
  })

  const withChannel = await supabase
    .from("patients")
    .select("id, full_name, phone, access_code, therapist_id, assigned_therapist_id, notify_channel, token")

  const patientsQuery = isMissingNotifyChannelColumn(withChannel.error)
    ? await supabase
        .from("patients")
        .select("id, full_name, phone, access_code, therapist_id, assigned_therapist_id, token")
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
  const { tokensByPatient, missingTable: missingPushTable } = await listPushTokensByPatientIds(
    supabase,
    patientIds,
  )
  if (missingPushTable) {
    reminderWarn("Tabela patient_push_tokens lipsește. Rulează sql/023_patient_push_tokens.sql.")
  }

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
    patientsWithPush: tokensByPatient.size,
  })

  for (const patient of patients) {
    try {
    const phone = typeof patient.phone === "string" ? patient.phone.trim() : ""
    const accessCode = typeof patient.access_code === "string" ? patient.access_code.trim() : ""
    const storedNotifyChannel = patient.notify_channel ?? null
    // Preferința veche `whatsapp` din DB este ignorată: trimitem doar SMS.
    const channel = resolveNotifyChannel(storedNotifyChannel)
    const pushTokens = tokensByPatient.get(patient.id) ?? []
    const hasValidPhone = Boolean(toWhatsAppNumber(phone))
    const hasAccessCode = /^\d{8}$/.test(accessCode)
    const delivery = chooseReminderDelivery({
      pushTokens,
      hasValidPhone,
      hasAccessCode,
    })
    const base = {
      patientId: patient.id,
      fullName: patient.full_name,
      phone: maskPhone(phone),
      notifyChannel: channel,
      storedNotifyChannel,
      ignoredWhatsAppPreference: storedNotifyChannel === "whatsapp",
      delivery,
      pushTokenCount: pushTokens.length,
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

    if (delivery === "none") {
      skipped += 1
      const reason = !hasValidPhone
        ? "Lipsește telefonul (și nu există token push)."
        : "Cod de acces invalid (și nu există token push)."
      reminderWarn(`Sărit: ${reason}`, { ...base, accessCodeLength: accessCode.length })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason,
      })
      continue
    }

    if (delivery === "sms" && !providers.twilioSms) {
      reminderWarn("Canal SMS, dar Twilio SMS nu e configurat.", {
        ...base,
        channel,
        providers,
      })
    }

    if (delivery === "push" && !providers.fcm) {
      reminderWarn("Canal push, dar Firebase Admin nu e configurat pe server.", {
        ...base,
        providers,
      })
    }

    eligible += 1
    const clinicName = clinicNameForPatient(patient, clinicsByUserId)
    const firstName = patient.full_name.trim().split(/\s+/)[0] || patient.full_name
    const message = patientCheckinReminderMessage({
      fullName: patient.full_name,
      clinicName,
      accessCode,
    })
    const portalUrl =
      typeof patient.token === "string" && patient.token
        ? patientPortalUrl(patient.token)
        : patientAccessUrlWithCode(accessCode)

    if (options.dryRun) {
      reminderLog("Dry-run: aș trimite, dar nu trimit.", {
        ...base,
        channel: delivery,
        message,
        portalUrl,
      })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "skipped",
        reason: "dry-run",
        channel: delivery,
      })
      continue
    }

    reminderLog("Trimit reminder.", { ...base, channel: delivery, clinicName, message, portalUrl })

    if (delivery === "push") {
      const push = await sendPushToTokens(pushTokens, {
        title: `${clinicName}: check-in`,
        body: `Bună, ${firstName}! Nu ai făcut încă check-in-ul de azi. Deschide programul și notează cum te simți.`,
        url: portalUrl,
      })
      if (push.sent) {
        sent += 1
        reminderLog("Trimis push.", {
          ...base,
          channel: "push",
          provider: push.provider,
          successCount: push.successCount,
          failureCount: push.failureCount,
        })
        outcomes.push({
          patientId: patient.id,
          fullName: patient.full_name,
          status: "sent",
          channel: "push",
          provider: push.provider,
        })
        continue
      }

      if (hasValidPhone && hasAccessCode) {
        reminderWarn("Push eșuat, încerc SMS.", { ...base, error: push.error, providers })
        const sms = await sendPatientNotification(phone, message, "sms")
        if (sms.sent) {
          sent += 1
          reminderLog("Trimis SMS (fallback după push).", {
            ...base,
            channel: sms.channel,
            provider: sms.provider,
          })
          outcomes.push({
            patientId: patient.id,
            fullName: patient.full_name,
            status: "sent",
            channel: sms.channel,
            provider: sms.provider,
          })
          continue
        }
      }

      failed += 1
      reminderWarn("Trimitere push eșuată.", {
        ...base,
        channel: "push",
        provider: push.provider,
        error: push.error ?? "Trimitere eșuată.",
        providers,
      })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "failed",
        reason: push.error ?? "Trimitere eșuată.",
        channel: "push",
        provider: push.provider,
      })
      continue
    }

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
    } catch (error) {
      failed += 1
      const message = error instanceof Error ? error.message : "Eroare necunoscută."
      reminderWarn("Eroare la un pacient; continui cu restul.", {
        patientId: patient.id,
        fullName: patient.full_name,
        error: message,
      })
      outcomes.push({
        patientId: patient.id,
        fullName: patient.full_name,
        status: "failed",
        reason: message,
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
