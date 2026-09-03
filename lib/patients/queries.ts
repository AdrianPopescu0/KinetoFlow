import { cache } from "react"

import { getCachedUser } from "@/lib/auth/session"
import { clinicIdFromUser } from "@/lib/clinics/profile"
import { sevenDayCompliancePercent } from "@/lib/patients/compliance"
import { isBucharestToday } from "@/lib/time/bucharest"
import { getOwnPatientRow, selectOwnPatients } from "@/lib/patients/tenant"
import type {
  CheckInRecord,
  DashboardStats,
  ExerciseRecord,
  PatientListItem,
  PatientRecord,
} from "@/lib/patients/types-db"

const PATIENT_LIST_COLUMNS =
  "id, user_id, therapist_id, assigned_therapist_id, full_name, email, phone, diagnosis, token, access_code, created_at, check_ins(patient_id, vas_score, created_at)"
const PATIENT_LIST_COLUMNS_PLAIN =
  "id, user_id, therapist_id, assigned_therapist_id, full_name, email, phone, diagnosis, token, access_code, created_at"
const PATIENT_COLUMNS_STAMPED =
  "id, user_id, therapist_id, assigned_therapist_id, full_name, email, phone, diagnosis, clinical_notes, token, access_code, created_at, updated_at"
const PATIENT_COLUMNS =
  "id, user_id, therapist_id, assigned_therapist_id, full_name, email, phone, diagnosis, clinical_notes, token, access_code, created_at"
const PATIENT_LIST_COLUMNS_NO_ASSIGN =
  "id, user_id, therapist_id, full_name, email, phone, diagnosis, token, access_code, created_at, check_ins(patient_id, vas_score, created_at)"
const PATIENT_LIST_COLUMNS_PLAIN_NO_ASSIGN =
  "id, user_id, therapist_id, full_name, email, phone, diagnosis, token, access_code, created_at"
const PATIENT_COLUMNS_FALLBACK =
  "id, therapist_id, full_name, email, phone, diagnosis, token, created_at"
const PATIENT_PICKER_COLUMNS = "id, full_name, diagnosis"

function isMissingRelation(error: { message: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  return (
    error.message.includes("schema cache") ||
    error.message.includes("does not exist") ||
    error.code === "42P01" ||
    error.code === "PGRST205"
  )
}

function withClinicalNotes(row: Record<string, unknown>): PatientRecord {
  const ownerId =
    (typeof row.user_id === "string" && row.user_id) ||
    (typeof row.therapist_id === "string" && row.therapist_id) ||
    ""
  return {
    id: String(row.id),
    user_id: ownerId,
    therapist_id: typeof row.therapist_id === "string" ? row.therapist_id : ownerId,
    full_name: String(row.full_name),
    email: typeof row.email === "string" ? row.email : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : null,
    clinical_notes: typeof row.clinical_notes === "string" ? row.clinical_notes : null,
    token: String(row.token),
    access_code: typeof row.access_code === "string" ? row.access_code : null,
    created_at: String(row.created_at),
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
    assigned_therapist_id:
      typeof row.assigned_therapist_id === "string" ? row.assigned_therapist_id : null,
  }
}

async function currentTherapist() {
  const { supabase, user } = await getCachedUser()
  return {
    supabase,
    userId: user?.id ?? null,
    clinicId: user?.id ?? null,
  }
}

export const listTherapistPatients = cache(async (): Promise<{
  patients: PatientListItem[]
  stats: DashboardStats
  error: string | null
  needsMigration: boolean
}> => {
  const emptyStats: DashboardStats = {
    activePatients: 0,
    checkInsToday: 0,
    painAlerts: 0,
    compliancePercent: 0,
  }

  const { supabase, userId, clinicId } = await currentTherapist()
  if (!userId || !clinicId) {
    return { patients: [], stats: emptyStats, error: "Sesiunea a expirat.", needsMigration: false }
  }

  const { data, error } = await selectOwnPatients(supabase, userId, PATIENT_LIST_COLUMNS, clinicId)

  if (error) {
    const withoutAssign = await selectOwnPatients(supabase, userId, PATIENT_LIST_COLUMNS_NO_ASSIGN, clinicId)
    if (!withoutAssign.error) {
      return assemblePatientList((withoutAssign.data ?? []) as Record<string, unknown>[], supabase)
    }

    const fallback = await selectOwnPatients(supabase, userId, PATIENT_LIST_COLUMNS_PLAIN, clinicId)

    if (fallback.error) {
      const plainNoAssign = await selectOwnPatients(
        supabase,
        userId,
        PATIENT_LIST_COLUMNS_PLAIN_NO_ASSIGN,
        clinicId,
      )
      if (!plainNoAssign.error) {
        return assemblePatientList((plainNoAssign.data ?? []) as Record<string, unknown>[], supabase)
      }

      const legacy = await selectOwnPatients(supabase, userId, PATIENT_COLUMNS_FALLBACK, clinicId)
      if (legacy.error) {
        return {
          patients: [],
          stats: emptyStats,
          error: isMissingRelation(legacy.error)
            ? "Tabela patients nu există încă. Rulează supabase/migrations/001_patients.sql în SQL Editor."
            : legacy.error.message,
          needsMigration: isMissingRelation(legacy.error),
        }
      }
      return assemblePatientList((legacy.data ?? []) as Record<string, unknown>[], supabase)
    }

    return assemblePatientList((fallback.data ?? []) as Record<string, unknown>[], supabase)
  }

  return assemblePatientList((data ?? []) as Record<string, unknown>[], supabase)
})

async function assemblePatientList(
  rawPatients: Record<string, unknown>[],
  supabase: Awaited<ReturnType<typeof currentTherapist>>["supabase"],
) {
  const patients = rawPatients.map(withClinicalNotes)
  const hasEmbedded = rawPatients.some((row) => Array.isArray(row.check_ins))
  let checkIns: Array<Pick<CheckInRecord, "patient_id" | "vas_score" | "created_at">> = []

  if (hasEmbedded) {
    checkIns = rawPatients.flatMap((row) => {
      const nested = row.check_ins
      return Array.isArray(nested) ? (nested as Array<Pick<CheckInRecord, "patient_id" | "vas_score" | "created_at">>) : []
    })
  } else {
    const ids = patients.map((patient) => patient.id)
    if (ids.length > 0) {
      const { data } = await supabase
        .from("check_ins")
        .select("patient_id, vas_score, created_at")
        .in("patient_id", ids)
        .order("created_at", { ascending: false })
      checkIns = (data ?? []) as Array<Pick<CheckInRecord, "patient_id" | "vas_score" | "created_at">>
    }
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const latestByPatient = new Map<string, Pick<CheckInRecord, "patient_id" | "vas_score" | "created_at">>()

  for (const row of checkIns) {
    const current = latestByPatient.get(row.patient_id)
    if (!current || row.created_at > current.created_at) {
      latestByPatient.set(row.patient_id, row)
    }
  }

  const list: PatientListItem[] = patients.map((patient) => {
    const latest = latestByPatient.get(patient.id)
    return {
      ...patient,
      lastVas: latest ? latest.vas_score : null,
      lastCheckInAt: latest?.created_at ?? null,
    }
  })

  const checkInsToday = checkIns.filter((row) => isBucharestToday(row.created_at)).length
  const painAlerts = list.filter((patient) => (patient.lastVas ?? 0) >= 7).length
  const compliant = list.filter((patient) => {
    if (!patient.lastCheckInAt) {
      return false
    }
    return new Date(patient.lastCheckInAt).getTime() >= weekAgo
  }).length

  return {
    patients: list,
    stats: {
      activePatients: list.length,
      checkInsToday,
      painAlerts,
      compliancePercent: sevenDayCompliancePercent(compliant, list.length),
    },
    error: null,
    needsMigration: false,
  }
}

export const getTherapistPatient = cache(async (id: string): Promise<{
  patient: PatientRecord | null
  exercises: ExerciseRecord[]
  checkIns: CheckInRecord[]
  error: string | null
}> => {
  const { supabase, userId, clinicId } = await currentTherapist()
  if (!userId || !clinicId) {
    return { patient: null, exercises: [], checkIns: [], error: "Sesiunea a expirat." }
  }

  const stamped = await getOwnPatientRow(supabase, userId, id, PATIENT_COLUMNS_STAMPED, clinicId)
  if (!stamped.error && stamped.data) {
    return loadPatientRelations(supabase, withClinicalNotes(stamped.data as Record<string, unknown>))
  }

  const { data: patientRow, error } = await getOwnPatientRow(supabase, userId, id, PATIENT_COLUMNS, clinicId)

  if (error || !patientRow) {
    const fallback = await getOwnPatientRow(supabase, userId, id, PATIENT_COLUMNS_FALLBACK, clinicId)

    if (fallback.error || !fallback.data) {
      return { patient: null, exercises: [], checkIns: [], error: "Pacientul nu a fost găsit." }
    }

    return loadPatientRelations(supabase, withClinicalNotes(fallback.data as Record<string, unknown>))
  }

  return loadPatientRelations(supabase, withClinicalNotes(patientRow as Record<string, unknown>))
})

async function loadPatientRelations(
  supabase: Awaited<ReturnType<typeof currentTherapist>>["supabase"],
  patient: PatientRecord,
) {
  const [{ data: exercises }, { data: checkIns }] = await Promise.all([
    supabase
      .from("exercises")
      .select("id, patient_id, title, video_url, sets, reps, notes")
      .eq("patient_id", patient.id)
      .order("title", { ascending: true }),
    supabase
      .from("check_ins")
      .select("id, patient_id, vas_score, sleep_quality, pain_type, notes, created_at")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false }),
  ])

  return {
    patient,
    exercises: (exercises ?? []) as ExerciseRecord[],
    checkIns: (checkIns ?? []) as CheckInRecord[],
    error: null,
  }
}

export const listTherapistPatientSummaries = cache(async () => {
  const { supabase, userId, clinicId } = await currentTherapist()
  if (!userId || !clinicId) {
    return [] as Array<{ id: string; fullName: string; diagnosis: string | null }>
  }

  const { data, error } = await selectOwnPatients(supabase, userId, PATIENT_PICKER_COLUMNS, clinicId)
  const rows = !error
    ? data
    : (await selectOwnPatients(supabase, userId, "id, full_name, diagnosis", clinicId)).data

  return ((rows ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name),
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : null,
  }))
})
