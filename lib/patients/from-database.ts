import type { Exercise, PatientProgram } from "@/lib/patients/types"
import type { ExerciseRecord, PatientRecord } from "@/lib/patients/types-db"
import { createServiceRoleClient } from "@/utils/supabase/admin"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPatientUuidToken(token: string): boolean {
  return UUID_PATTERN.test(token)
}

export function youtubeIdFromUrl(url: string | null): string | null {
  if (!url) {
    return null
  }

  const trimmed = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0]
      return id || null
    }
    const fromQuery = parsed.searchParams.get("v")
    if (fromQuery) {
      return fromQuery
    }
    const parts = parsed.pathname.split("/").filter(Boolean)
    const embedIndex = parts.indexOf("embed")
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1]
    }
    return parts.at(-1) ?? null
  } catch {
    return null
  }
}

function firstNameFromFullName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

function mapExercises(rows: ExerciseRecord[]): Exercise[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: row.notes?.trim() || "Programul tău",
    youtubeId: youtubeIdFromUrl(row.video_url) ?? "xpQM250vj3E",
    sets: row.sets ?? 3,
    reps: row.reps ?? 10,
    restSeconds: 30,
  }))
}

export async function loadPatientProgramFromDatabase(
  token: string,
): Promise<PatientProgram | null> {
  if (!isPatientUuidToken(token)) {
    return null
  }

  try {
    const supabase = createServiceRoleClient()
    const { data: patient, error } = await supabase
      .from("patients")
      .select("id, full_name, diagnosis, token")
      .eq("token", token)
      .maybeSingle()

    if (error || !patient) {
      return null
    }

    const record = patient as Pick<PatientRecord, "id" | "full_name" | "diagnosis" | "token">
    const { data: exerciseRows } = await supabase
      .from("exercises")
      .select("id, patient_id, title, video_url, sets, reps, notes")
      .eq("patient_id", record.id)

    const exercises = mapExercises((exerciseRows ?? []) as ExerciseRecord[])

    return {
      token: record.token,
      firstName: firstNameFromFullName(record.full_name),
      programLabel: record.diagnosis?.trim() || "Programul tău de recuperare",
      progressPercent: exercises.length > 0 ? 20 : 0,
      exercises,
    }
  } catch {
    return null
  }
}
