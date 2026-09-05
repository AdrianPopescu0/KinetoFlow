import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import {
  DIFFICULTIES,
  EQUIPMENT,
  POSITIONS,
  REGIONS,
  objectiveBelongsToRegion,
} from "@/lib/exercises/taxonomy"
import type {
  AnatomicalRegion,
  Difficulty,
  Equipment,
  ExercisePosition,
  LibraryExercise,
  TherapeuticObjective,
} from "@/lib/exercises/types"
import { youtubeIdFromUrl } from "@/lib/patients/youtube"
import { getCachedUser } from "@/lib/auth/session"

type LibraryRow = {
  id: string
  title: string
  description?: string | null
  notes?: string | null
  region?: string | null
  subcategory?: string | null
  difficulty?: string | null
  equipment?: string | null
  position?: string | null
  sets?: number | null
  reps?: number | null
  duration_seconds?: number | null
  youtube_id?: string | null
  video_url?: string | null
}

function isRegion(value: string): value is AnatomicalRegion {
  return REGIONS.some((region) => region.id === value)
}

function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTIES.some((item) => item.id === value)
}

function isEquipment(value: string): value is Equipment {
  return EQUIPMENT.some((item) => item.id === value)
}

function isPosition(value: string): value is ExercisePosition {
  return POSITIONS.some((item) => item.id === value)
}

export function mapLibraryRow(row: LibraryRow): LibraryExercise | null {
  const region = typeof row.region === "string" && isRegion(row.region) ? row.region : "functional"
  const subcategory =
    typeof row.subcategory === "string" &&
    objectiveBelongsToRegion(region, row.subcategory as TherapeuticObjective)
      ? (row.subcategory as TherapeuticObjective)
      : (REGIONS.find((item) => item.id === region)?.subcategories[0]?.id ?? "balance")
  const difficulty =
    typeof row.difficulty === "string" && isDifficulty(row.difficulty) ? row.difficulty : "usor"
  const equipment =
    typeof row.equipment === "string" && isEquipment(row.equipment) ? row.equipment : "none"
  const position =
    typeof row.position === "string" && isPosition(row.position) ? row.position : "sitting"
  const videoUrl = row.video_url?.trim() || null
  const youtubeId = row.youtube_id?.trim() || youtubeIdFromUrl(videoUrl)

  if (!row.id || !row.title?.trim()) {
    return null
  }

  return {
    id: row.id,
    title: row.title.trim(),
    description: (row.description ?? row.notes ?? "").trim(),
    region,
    subcategory,
    difficulty,
    equipment,
    position,
    sets: row.sets && row.sets > 0 ? row.sets : 3,
    reps: row.reps && row.reps > 0 ? row.reps : 10,
    durationSeconds: row.duration_seconds && row.duration_seconds > 0 ? row.duration_seconds : 90,
    youtubeId,
    videoUrl,
    custom: true,
  }
}

export async function listStoredLibraryExercises(): Promise<LibraryExercise[]> {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    return []
  }

  const full = await supabase
    .from("exercise_library")
    .select(
      "id, title, description, notes, region, subcategory, difficulty, equipment, position, sets, reps, duration_seconds, youtube_id, video_url",
    )
    .order("created_at", { ascending: false })

  const rows = full.error
    ? (
        await supabase
          .from("exercise_library")
          .select("id, title, notes, region, video_url")
          .order("created_at", { ascending: false })
      ).data
    : full.data

  if (!rows) {
    return []
  }

  return rows
    .map((row) => mapLibraryRow(row as LibraryRow))
    .filter((item): item is LibraryExercise => item !== null)
}

export async function listLibraryCatalog(): Promise<LibraryExercise[]> {
  const stored = await listStoredLibraryExercises()
  const storedIds = new Set(stored.map((item) => item.id))
  return [...stored, ...LIBRARY_EXERCISES.filter((item) => !storedIds.has(item.id))]
}

export function libraryExerciseToRow(exercise: LibraryExercise) {
  return {
    title: exercise.title,
    description: exercise.description,
    notes: exercise.description,
    region: exercise.region,
    subcategory: exercise.subcategory,
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    position: exercise.position,
    sets: exercise.sets,
    reps: exercise.reps,
    duration_seconds: exercise.durationSeconds,
    youtube_id: exercise.youtubeId,
    video_url: exercise.videoUrl,
  }
}
