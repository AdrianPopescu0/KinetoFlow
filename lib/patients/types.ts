export type SleepQuality = "odihnitor" | "moderat" | "intrerupt"

export type PainKind = "efort" | "continua" | "rigiditate" | "fara"

export type Exercise = {
  id: string
  title: string
  category: string
  youtubeId: string | null
  videoUrl: string | null
  sets: number
  reps: number
  restSeconds: number
  instructions: string
}

export type PatientProgram = {
  token: string
  patientId?: string
  firstName: string
  fullName?: string
  programLabel: string
  progressPercent: number
  exercises: Exercise[]
}

export type DailyCheckin = {
  submittedAt: string
  localDate: string
  pain: number
  sleep: SleepQuality
  painKind: PainKind | null
  notes: string
  completedExerciseIds: string[]
}
