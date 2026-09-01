export type SleepQuality = "slab" | "mediu" | "foarte-bun"

export type PainKind = "efort" | "continua" | "rigiditate" | "fara"

export type Exercise = {
  id: string
  title: string
  category: string
  youtubeId: string
  sets: number
  reps: number
  restSeconds: number
}

export type PatientProgram = {
  token: string
  firstName: string
  programLabel: string
  progressPercent: number
  exercises: Exercise[]
}

export type DailyCheckin = {
  submittedAt: string
  localDate: string
  pain: number
  sleep: SleepQuality
  painKind: PainKind
  notes: string
  completedExerciseIds: string[]
}
