import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { hydrateLibraryExercise } from "@/lib/exercises/hydrate"
import { serializeTagList } from "@/lib/exercises/tags"
import { normalizePosition } from "@/lib/exercises/taxonomy"
import type { LibraryExercise } from "@/lib/exercises/types"
import { youtubeIdFromUrl } from "@/lib/patients/youtube"
import { getCachedUser } from "@/lib/auth/session"

type LibraryRow = {
  id: string
  title: string
  description?: string | null
  notes?: string | null
  region?: string | string[] | null
  subcategory?: string | string[] | null
  difficulty?: string | null
  equipment?: string | string[] | null
  position?: string | null
  sets?: number | null
  reps?: number | null
  duration_seconds?: number | null
  youtube_id?: string | null
  video_url?: string | null
}

export function mapLibraryRow(row: LibraryRow): LibraryExercise | null {
  if (!row.id || !row.title?.trim()) {
    return null
  }

  const videoUrl = row.video_url?.trim() || null
  return hydrateLibraryExercise({
    id: row.id,
    title: row.title.trim(),
    description: (row.description ?? row.notes ?? "").trim(),
    region: row.region,
    subcategory: row.subcategory,
    difficulty: row.difficulty === "mediu" || row.difficulty === "avansat" ? row.difficulty : "usor",
    equipment: row.equipment,
    position: normalizePosition(row.position),
    sets: row.sets && row.sets > 0 ? row.sets : 3,
    reps: row.reps && row.reps > 0 ? row.reps : 10,
    durationSeconds: row.duration_seconds && row.duration_seconds > 0 ? row.duration_seconds : 90,
    youtubeId: row.youtube_id?.trim() || youtubeIdFromUrl(videoUrl),
    videoUrl,
    custom: true,
  })
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

  if (full.error && /does not exist|schema cache/i.test(full.error.message)) {
    return []
  }

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
    region: serializeTagList(exercise.regions),
    subcategory: serializeTagList(exercise.objectives),
    difficulty: exercise.difficulty,
    equipment: serializeTagList(exercise.equipments),
    position: exercise.position,
    sets: exercise.sets,
    reps: exercise.reps,
    duration_seconds: exercise.durationSeconds,
    youtube_id: exercise.youtubeId,
    video_url: exercise.videoUrl,
  }
}
