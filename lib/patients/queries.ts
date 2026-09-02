import { startOfTodayIso } from "@/lib/patients/display"
import type {
  CheckInRecord,
  DashboardStats,
  ExerciseRecord,
  PatientListItem,
  PatientRecord,
} from "@/lib/patients/types-db"
import { createClient } from "@/utils/supabase/server"

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
  return {
    id: String(row.id),
    therapist_id: String(row.therapist_id),
    full_name: String(row.full_name),
    email: typeof row.email === "string" ? row.email : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : null,
    clinical_notes: typeof row.clinical_notes === "string" ? row.clinical_notes : null,
    token: String(row.token),
    access_code: typeof row.access_code === "string" ? row.access_code : null,
    created_at: String(row.created_at),
  }
}

export async function listTherapistPatients(): Promise<{
  patients: PatientListItem[]
  stats: DashboardStats
  error: string | null
  needsMigration: boolean
}> {
  const emptyStats: DashboardStats = {
    activePatients: 0,
    checkInsToday: 0,
    painAlerts: 0,
    compliancePercent: 0,
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("patients")
    .select("id, therapist_id, full_name, email, phone, diagnosis, clinical_notes, token, access_code, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    const fallback = await supabase
      .from("patients")
      .select("id, therapist_id, full_name, email, phone, diagnosis, token, created_at")
      .order("created_at", { ascending: false })

    if (fallback.error) {
      return {
        patients: [],
        stats: emptyStats,
        error: isMissingRelation(fallback.error)
          ? "Tabela patients nu există încă. Rulează supabase/migrations/001_patients.sql în SQL Editor."
          : "Nu am putut încărca pacienții. Încearcă din nou.",
        needsMigration: isMissingRelation(fallback.error),
      }
    }

    return assemblePatientList((fallback.data ?? []) as Record<string, unknown>[])
  }

  return assemblePatientList((data ?? []) as Record<string, unknown>[])
}

async function assemblePatientList(rawPatients: Record<string, unknown>[]) {
  const patients = rawPatients.map(withClinicalNotes)
  const supabase = await createClient()
  const ids = patients.map((patient) => patient.id)

  let checkIns: CheckInRecord[] = []
  if (ids.length > 0) {
    const { data } = await supabase
      .from("check_ins")
      .select("id, patient_id, vas_score, sleep_quality, pain_type, notes, created_at")
      .in("patient_id", ids)
      .order("created_at", { ascending: false })
    checkIns = (data ?? []) as CheckInRecord[]
  }

  const today = startOfTodayIso().slice(0, 10)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const latestByPatient = new Map<string, CheckInRecord>()

  for (const row of checkIns) {
    if (!latestByPatient.has(row.patient_id)) {
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

  const checkInsToday = checkIns.filter((row) => row.created_at.slice(0, 10) === today).length
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
      compliancePercent: list.length === 0 ? 0 : Math.round((compliant / list.length) * 100),
    },
    error: null,
    needsMigration: false,
  }
}

export async function getTherapistPatient(id: string): Promise<{
  patient: PatientRecord | null
  exercises: ExerciseRecord[]
  checkIns: CheckInRecord[]
  error: string | null
}> {
  const supabase = await createClient()
  const { data: patientRow, error } = await supabase
    .from("patients")
    .select("id, therapist_id, full_name, email, phone, diagnosis, clinical_notes, token, access_code, created_at")
    .eq("id", id)
    .maybeSingle()

  if (error || !patientRow) {
    const fallback = await supabase
      .from("patients")
      .select("id, therapist_id, full_name, email, phone, diagnosis, token, created_at")
      .eq("id", id)
      .maybeSingle()

    if (fallback.error || !fallback.data) {
      return { patient: null, exercises: [], checkIns: [], error: "Pacientul nu a fost găsit." }
    }

    return loadPatientRelations(withClinicalNotes(fallback.data as Record<string, unknown>))
  }

  return loadPatientRelations(withClinicalNotes(patientRow as Record<string, unknown>))
}

async function loadPatientRelations(patient: PatientRecord) {
  const supabase = await createClient()
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
