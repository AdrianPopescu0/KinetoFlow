export type AnatomicalRegion = "cervical" | "lumbar" | "upper" | "lower" | "functional"

export type Difficulty = "usor" | "mediu" | "avansat"

export type Equipment = "none" | "bands" | "dumbbells" | "ball" | "roller"

export type ExercisePosition = "lying" | "sitting" | "standing"

export type LibraryExercise = {
  id: string
  title: string
  description: string
  region: AnatomicalRegion
  subcategory: string
  difficulty: Difficulty
  equipment: Equipment
  position: ExercisePosition
  sets: number
  reps: number
  durationSeconds: number
  youtubeId: string | null
  videoUrl: string | null
  custom?: boolean
}

export type LibraryFilters = {
  query: string
  region: AnatomicalRegion | "all"
  subcategory: string | "all"
  difficulty: Difficulty | "all"
  equipment: Equipment | "all"
  position: ExercisePosition | "all"
}

export type AssignablePatient = {
  id: string
  fullName: string
  diagnosis: string | null
}
