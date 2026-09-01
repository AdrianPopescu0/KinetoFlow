export type PatientRecord = {
  id: string
  therapist_id: string
  full_name: string
  email: string | null
  phone: string | null
  diagnosis: string | null
  token: string
  created_at: string
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
