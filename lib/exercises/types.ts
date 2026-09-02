export type AnatomicalRegion =
  | "cervical"
  | "thoracic"
  | "lumbar"
  | "pelvis"
  | "upper"
  | "lower"
  | "functional"

export type Difficulty = "usor" | "mediu" | "avansat"

export type Equipment = "none" | "bands" | "dumbbells" | "ball" | "roller"

export type ExercisePosition = "lying" | "sitting" | "standing"

export type TherapeuticObjective =
  | "neck-mobility"
  | "head-posture"
  | "trap-stretch"
  | "chest-open"
  | "trunk-rotation"
  | "midback-relax"
  | "lumbar-relax"
  | "core"
  | "lumbar-stretch"
  | "pelvic-tilt"
  | "glute-hip"
  | "pelvic-relax"
  | "shoulder"
  | "elbow"
  | "wrist-fingers"
  | "hip"
  | "knee"
  | "ankle-heel"
  | "balance"
  | "gait"
  | "breathing"

export type LibraryExercise = {
  id: string
  title: string
  description: string
  region: AnatomicalRegion
  subcategory: TherapeuticObjective
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
  subcategory: TherapeuticObjective | "all"
  difficulty: Difficulty | "all"
  equipment: Equipment | "all"
  position: ExercisePosition | "all"
}

export type AssignablePatient = {
  id: string
  fullName: string
  diagnosis: string | null
}
