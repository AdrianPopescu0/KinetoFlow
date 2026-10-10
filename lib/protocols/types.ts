export type ProtocolExercise = {
  id: string
  libraryExerciseId: string | null
  title: string
  description: string | null
  videoUrl: string | null
  sets: number | null
  reps: number | null
  sortOrder: number
}

export type TrainingProtocol = {
  id: string
  title: string
  description: string | null
  notes: string | null
  region: string | null
  difficulty: string | null
  clinicName: string
  createdBy: string
  createdAt: string
  updatedAt: string
  exercises: ProtocolExercise[]
}

export type ProtocolExerciseInput = {
  libraryExerciseId: string
  title: string
  description?: string | null
  videoUrl?: string | null
  sets?: number | null
  reps?: number | null
}
