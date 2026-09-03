export type PatientRecord = {
  id: string
  therapist_id: string
  full_name: string
  email: string | null
  phone: string | null
  diagnosis: string | null
  clinical_notes: string | null
  token: string
  access_code: string | null
  created_at: string
  updated_at: string | null
  assigned_therapist_id: string | null
}

export type ExerciseRecord = {
  id: string
  patient_id: string
  title: string
  video_url: string | null
  sets: number | null
  reps: number | null
  notes: string | null
}

export type CheckInRecord = {
  id: string
  patient_id: string
  vas_score: number
  sleep_quality: string | null
  pain_type: string | null
  notes: string | null
  created_at: string
}

export type PatientListItem = PatientRecord & {
  lastVas: number | null
  lastCheckInAt: string | null
}

export type DashboardStats = {
  activePatients: number
  checkInsToday: number
  painAlerts: number
  compliancePercent: number
}
