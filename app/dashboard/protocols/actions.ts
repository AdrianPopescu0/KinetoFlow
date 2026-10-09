"use server"

import { revalidatePath } from "next/cache"

import { getCachedUser } from "@/lib/auth/session"
import { clinicNameForUser } from "@/lib/clinics/members"
import { isAnatomicalRegion } from "@/lib/exercises/taxonomy"
import {
  getTrainingProtocol,
  listTrainingProtocols,
  protocolExerciseInsertRows,
  protocolFromRow,
} from "@/lib/protocols/store"
import type { ProtocolExerciseInput, TrainingProtocol } from "@/lib/protocols/types"
import { formatSupabaseError } from "@/lib/supabase/format-error"

export type ProtocolMutationState = {
  error: string | null
  protocol?: TrainingProtocol | null
}

export type ProtocolPayload = {
  title: string
  description?: string
  notes?: string
  region?: string | null
  difficulty?: string | null
  exercises: ProtocolExerciseInput[]
}

function normalizePayload(input: ProtocolPayload): ProtocolPayload | { error: string } {
  const title = input.title.trim()
  if (!title) {
    return { error: "Completează titlul protocolului." }
  }
  if (!Array.isArray(input.exercises) || input.exercises.length === 0) {
    return { error: "Adaugă cel puțin un exercițiu din bibliotecă." }
  }

  const regionRaw = (input.region ?? "").trim()
  const region = !regionRaw || regionRaw === "all" ? null : isAnatomicalRegion(regionRaw) ? regionRaw : null
  const difficultyRaw = (input.difficulty ?? "").trim()
  const difficulty =
    difficultyRaw === "usor" || difficultyRaw === "mediu" || difficultyRaw === "avansat" ? difficultyRaw : null

  const exercises = input.exercises
    .map((exercise) => ({
      libraryExerciseId: String(exercise.libraryExerciseId ?? "").trim(),
      title: String(exercise.title ?? "").trim(),
      description: exercise.description ?? null,
      videoUrl: exercise.videoUrl ?? null,
      sets: typeof exercise.sets === "number" ? exercise.sets : null,
      reps: typeof exercise.reps === "number" ? exercise.reps : null,
    }))
    .filter((exercise) => exercise.title.length > 0 && exercise.libraryExerciseId.length > 0)

  if (exercises.length === 0) {
    return { error: "Adaugă cel puțin un exercițiu valid din bibliotecă." }
  }

  return {
    title,
    description: (input.description ?? "").trim(),
    notes: (input.notes ?? "").trim(),
    region,
    difficulty,
    exercises,
  }
}

export async function createTrainingProtocol(input: ProtocolPayload): Promise<ProtocolMutationState> {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const parsed = normalizePayload(input)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const clinicName = await clinicNameForUser(supabase, user.id)
  if (!clinicName) {
    return { error: "Nu am găsit cabinetul tău. Completează profilul clinicii înainte de a salva protocoale." }
  }

  const { data, error } = await supabase
    .from("training_protocols")
    .insert({
      title: parsed.title,
      description: parsed.description || null,
      notes: parsed.notes || null,
      region: parsed.region,
      difficulty: parsed.difficulty,
      clinic_name: clinicName,
      created_by: user.id,
    })
    .select("id, title, description, notes, region, difficulty, clinic_name, created_by, created_at, updated_at")
    .single()

  if (error || !data) {
    return {
      error: error
        ? formatSupabaseError(error)
        : "Nu am putut salva protocolul. Rulează sql/034_training_protocols.sql în Supabase.",
    }
  }

  const exerciseRows = protocolExerciseInsertRows(String(data.id), parsed.exercises)
  const { data: insertedExercises, error: exerciseError } = await supabase
    .from("training_protocol_exercises")
    .insert(exerciseRows)
    .select("id, protocol_id, library_exercise_id, title, description, video_url, sets, reps, sort_order, created_at")

  if (exerciseError) {
    await supabase.from("training_protocols").delete().eq("id", data.id)
    return { error: formatSupabaseError(exerciseError) }
  }

  revalidatePath("/dashboard/protocols")
  return {
    error: null,
    protocol: protocolFromRow(
      data,
      (insertedExercises ?? []).map((row) => ({
        id: String(row.id),
        libraryExerciseId: row.library_exercise_id ? String(row.library_exercise_id) : null,
        title: String(row.title),
        description: row.description ? String(row.description) : null,
        videoUrl: row.video_url ? String(row.video_url) : null,
        sets: typeof row.sets === "number" ? row.sets : null,
        reps: typeof row.reps === "number" ? row.reps : null,
        sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
      })),
    ),
  }
}

export async function updateTrainingProtocol(
  protocolId: string,
  input: ProtocolPayload,
): Promise<ProtocolMutationState> {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const id = protocolId.trim()
  if (!id) {
    return { error: "Protocol invalid." }
  }

  const parsed = normalizePayload(input)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const existing = await getTrainingProtocol(supabase, user.id, id)
  if (!existing) {
    return { error: "Protocolul nu a fost găsit sau nu aparține cabinetului tău." }
  }

  const { data, error } = await supabase
    .from("training_protocols")
    .update({
      title: parsed.title,
      description: parsed.description || null,
      notes: parsed.notes || null,
      region: parsed.region,
      difficulty: parsed.difficulty,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, title, description, notes, region, difficulty, clinic_name, created_by, created_at, updated_at")
    .single()

  if (error || !data) {
    return { error: error ? formatSupabaseError(error) : "Nu am putut actualiza protocolul." }
  }

  const { error: deleteError } = await supabase.from("training_protocol_exercises").delete().eq("protocol_id", id)
  if (deleteError) {
    return { error: formatSupabaseError(deleteError) }
  }

  const exerciseRows = protocolExerciseInsertRows(id, parsed.exercises)
  const { data: insertedExercises, error: exerciseError } = await supabase
    .from("training_protocol_exercises")
    .insert(exerciseRows)
    .select("id, protocol_id, library_exercise_id, title, description, video_url, sets, reps, sort_order, created_at")

  if (exerciseError) {
    return { error: formatSupabaseError(exerciseError) }
  }

  revalidatePath("/dashboard/protocols")
  return {
    error: null,
    protocol: protocolFromRow(
      data,
      (insertedExercises ?? []).map((row) => ({
        id: String(row.id),
        libraryExerciseId: row.library_exercise_id ? String(row.library_exercise_id) : null,
        title: String(row.title),
        description: row.description ? String(row.description) : null,
        videoUrl: row.video_url ? String(row.video_url) : null,
        sets: typeof row.sets === "number" ? row.sets : null,
        reps: typeof row.reps === "number" ? row.reps : null,
        sortOrder: typeof row.sort_order === "number" ? row.sort_order : 0,
      })),
    ),
  }
}

export async function deleteTrainingProtocol(id: string): Promise<ProtocolMutationState> {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou." }
  }

  const trimmed = id.trim()
  if (!trimmed) {
    return { error: "Protocol invalid." }
  }

  const { error } = await supabase.from("training_protocols").delete().eq("id", trimmed)
  if (error) {
    return { error: formatSupabaseError(error) }
  }

  revalidatePath("/dashboard/protocols")
  return { error: null }
}

export async function listClinicTrainingProtocols(): Promise<TrainingProtocol[]> {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    return []
  }
  return listTrainingProtocols(supabase, user.id)
}
