export type SleepQuality = "odihnitor" | "moderat" | "intrerupt"

export const SLEEP_QUALITY_VALUES = ["odihnitor", "moderat", "intrerupt"] as const

export function isSleepQuality(value: string | null): value is SleepQuality {
  return value === "odihnitor" || value === "moderat" || value === "intrerupt"
}

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
  therapistName: string
  therapistPhone: string | null
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
