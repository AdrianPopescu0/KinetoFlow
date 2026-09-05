"use server"

import { revalidatePath } from "next/cache"

import { getCachedUser } from "@/lib/auth/session"
import {
  EXERCISE_LIBRARY_EDITOR_EMAILS,
  LIBRARY_WRITE_FORBIDDEN,
  isExerciseLibraryEditor,
} from "@/lib/exercises/library-admin"
import { libraryExerciseToRow, listStoredLibraryExercises } from "@/lib/exercises/library-store"
import { objectiveBelongsToRegion } from "@/lib/exercises/taxonomy"
import type {
  AnatomicalRegion,
  Difficulty,
  Equipment,
  ExercisePosition,
  LibraryExercise,
  TherapeuticObjective,
} from "@/lib/exercises/types"
import { youtubeIdFromUrl } from "@/lib/patients/youtube"
import { formatSupabaseError } from "@/lib/supabase/format-error"

export type LibraryMutationState = {
  error: string | null
  exercise?: LibraryExercise | null
}

async function requireLibraryEditor() {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    return { error: "Sesiunea a expirat. Autentifică-te din nou.", supabase, user: null }
  }
  if (!isExerciseLibraryEditor(user.email)) {
    return { error: LIBRARY_WRITE_FORBIDDEN, supabase, user }
  }
  return { error: null, supabase, user }
}

function readText(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === "string" ? value.trim() : ""
}

function readNumber(formData: FormData, key: string, fallback: number): number {
  const parsed = Number(readText(formData, key))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function exerciseFromForm(formData: FormData, id?: string): LibraryExercise | { error: string } {
  const title = readText(formData, "title")
  const description = readText(formData, "description")
  if (!title || !description) {
    return { error: "Completează titlul și descrierea." }
  }

  const region = (readText(formData, "region") || "functional") as AnatomicalRegion
  const subcategory = (readText(formData, "subcategory") || "balance") as TherapeuticObjective
  if (!objectiveBelongsToRegion(region, subcategory)) {
    return { error: "Obiectivul terapeutic nu corespunde regiunii." }
  }

  const videoUrl = readText(formData, "video_url") || null
  return {
    id: id ?? crypto.randomUUID(),
    title,
    description,
    region,
    subcategory,
    difficulty: (readText(formData, "difficulty") || "usor") as Difficulty,
    equipment: (readText(formData, "equipment") || "none") as Equipment,
    position: (readText(formData, "position") || "sitting") as ExercisePosition,
    sets: readNumber(formData, "sets", 3),
    reps: readNumber(formData, "reps", 10),
    durationSeconds: readNumber(formData, "duration", 90),
    youtubeId: youtubeIdFromUrl(videoUrl),
    videoUrl,
    custom: true,
  }
}

export async function createLibraryExercise(formData: FormData): Promise<LibraryMutationState> {
  const gate = await requireLibraryEditor()
  if (gate.error || !gate.user) {
    return { error: gate.error ?? LIBRARY_WRITE_FORBIDDEN }
  }

  const parsed = exerciseFromForm(formData)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const { data, error } = await gate.supabase
    .from("exercise_library")
    .insert(libraryExerciseToRow(parsed))
    .select("id")
    .single()

  if (error || !data) {
    return {
      error: error
        ? formatSupabaseError(error)
        : "Nu am putut salva exercițiul. Verifică politica RLS pe exercise_library.",
    }
  }

  revalidatePath("/dashboard/exercises")
  return { error: null, exercise: { ...parsed, id: String(data.id) } }
}

export async function updateLibraryExercise(
  exerciseId: string,
  formData: FormData,
): Promise<LibraryMutationState> {
  const gate = await requireLibraryEditor()
  if (gate.error || !gate.user) {
    return { error: gate.error ?? LIBRARY_WRITE_FORBIDDEN }
  }

  const parsed = exerciseFromForm(formData, exerciseId)
  if ("error" in parsed) {
    return { error: parsed.error }
  }

  const { error } = await gate.supabase
    .from("exercise_library")
    .update({ ...libraryExerciseToRow(parsed), updated_at: new Date().toISOString() })
    .eq("id", exerciseId)

  if (error) {
    return { error: formatSupabaseError(error) }
  }

  revalidatePath("/dashboard/exercises")
  return { error: null, exercise: parsed }
}

export async function deleteLibraryExercise(exerciseId: string): Promise<LibraryMutationState> {
  const gate = await requireLibraryEditor()
  if (gate.error || !gate.user) {
    return { error: gate.error ?? LIBRARY_WRITE_FORBIDDEN }
  }

  const { error } = await gate.supabase.from("exercise_library").delete().eq("id", exerciseId)
  if (error) {
    return { error: formatSupabaseError(error) }
  }

  revalidatePath("/dashboard/exercises")
  return { error: null }
}

export async function loadStoredLibraryExercises(): Promise<LibraryExercise[]> {
  return listStoredLibraryExercises()
}

export function libraryEditorEmail(): string {
  return EXERCISE_LIBRARY_EDITOR_EMAILS.join(", ")
}
