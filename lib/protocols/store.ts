import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { clinicNameForUser, privilegedClinicClient } from "@/lib/clinics/members"
import type { ProtocolExercise, ProtocolExerciseInput, TrainingProtocol } from "@/lib/protocols/types"
import type { Database } from "@/lib/supabase/database.types"

type ProtocolRow = Database["public"]["Tables"]["training_protocols"]["Row"]
type ProtocolExerciseRow = Database["public"]["Tables"]["training_protocol_exercises"]["Row"]

export function protocolExerciseFromRow(row: ProtocolExerciseRow): ProtocolExercise {
  return {
    id: String(row.id),
    libraryExerciseId: row.library_exercise_id ? String(row.library_exercise_id) : null,
    title: String(row.title ?? "").trim(),
    description: row.description ? String(row.description) : null,
    videoUrl: row.video_url ? String(row.video_url) : null,
    sets: typeof row.sets === "number" && Number.isFinite(row.sets) ? row.sets : null,
    reps: typeof row.reps === "number" && Number.isFinite(row.reps) ? row.reps : null,
    sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
  }
}

export function protocolFromRow(
  row: ProtocolRow,
  exercises: ProtocolExercise[] = [],
): TrainingProtocol {
  return {
    id: String(row.id),
    title: String(row.title ?? "").trim(),
    description: row.description ? String(row.description) : null,
    notes: row.notes ? String(row.notes) : null,
    region: row.region ? String(row.region) : null,
    difficulty: row.difficulty ? String(row.difficulty) : null,
    clinicName: String(row.clinic_name ?? "").trim(),
    createdBy: String(row.created_by),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    exercises: [...exercises].sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

async function loadExercisesForProtocols(
  client: SupabaseClient,
  protocolIds: string[],
): Promise<Map<string, ProtocolExercise[]>> {
  const map = new Map<string, ProtocolExercise[]>()
  if (protocolIds.length === 0) {
    return map
  }

  const { data, error } = await client
    .from("training_protocol_exercises")
    .select("id, protocol_id, library_exercise_id, title, description, video_url, sets, reps, sort_order, created_at")
    .in("protocol_id", protocolIds)
    .order("sort_order", { ascending: true })

  if (error || !data) {
    return map
  }

  for (const row of data) {
    const protocolId = String(row.protocol_id)
    const list = map.get(protocolId) ?? []
    list.push(protocolExerciseFromRow(row as ProtocolExerciseRow))
    map.set(protocolId, list)
  }
  return map
}

export async function listTrainingProtocols(
  supabase: SupabaseClient,
  userId: string,
): Promise<TrainingProtocol[]> {
  const clinicName = await clinicNameForUser(supabase, userId)
  if (!clinicName) {
    return []
  }

  const client = await privilegedClinicClient(supabase)
  const { data, error } = await client
    .from("training_protocols")
    .select("id, title, description, notes, region, difficulty, clinic_name, created_by, created_at, updated_at")
    .ilike("clinic_name", clinicName)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error || !data) {
    return []
  }

  const wanted = clinicName.trim().toLocaleLowerCase("ro-RO")
  const rows = data.filter(
    (row) => String(row.clinic_name ?? "").trim().toLocaleLowerCase("ro-RO") === wanted,
  ) as ProtocolRow[]

  const exerciseMap = await loadExercisesForProtocols(
    client,
    rows.map((row) => row.id),
  )

  return rows.map((row) => protocolFromRow(row, exerciseMap.get(row.id) ?? []))
}

export async function getTrainingProtocol(
  supabase: SupabaseClient,
  userId: string,
  protocolId: string,
): Promise<TrainingProtocol | null> {
  const protocols = await listTrainingProtocols(supabase, userId)
  return protocols.find((item) => item.id === protocolId) ?? null
}

export function protocolExerciseInsertRows(protocolId: string, exercises: ProtocolExerciseInput[]) {
  return exercises
    .map((exercise, index) => {
      const title = exercise.title.trim()
      if (!title) {
        return null
      }
      return {
        protocol_id: protocolId,
        library_exercise_id: exercise.libraryExerciseId.trim() || null,
        title,
        description: exercise.description?.trim() || null,
        video_url: exercise.videoUrl?.trim() || null,
        sets: typeof exercise.sets === "number" && Number.isFinite(exercise.sets) ? exercise.sets : null,
        reps: typeof exercise.reps === "number" && Number.isFinite(exercise.reps) ? exercise.reps : null,
        sort_order: index,
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
}
