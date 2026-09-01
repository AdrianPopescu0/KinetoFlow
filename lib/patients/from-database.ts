import type { Exercise, PatientProgram } from "@/lib/patients/types"
import type { ExerciseRecord, PatientRecord } from "@/lib/patients/types-db"
import { youtubeIdFromUrl } from "@/lib/patients/youtube"
import { createServiceRoleClient } from "@/utils/supabase/admin"

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPatientUuidToken(token: string): boolean {
  return UUID_PATTERN.test(token)
}

function firstNameFromFullName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? fullName
}

function mapExercises(rows: ExerciseRecord[]): Exercise[] {
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    category: "Programul tău",
    youtubeId: youtubeIdFromUrl(row.video_url),
    videoUrl: row.video_url,
    sets: row.sets ?? 3,
    reps: row.reps ?? 10,
    restSeconds: 30,
    instructions: row.notes?.trim() || "",
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
      patientId: record.id,
      firstName: firstNameFromFullName(record.full_name),
      fullName: record.full_name,
      programLabel: record.diagnosis?.trim() || "Programul tău de recuperare",
      progressPercent: exercises.length > 0 ? 20 : 0,
      exercises,
    }
  } catch {
    return null
  }
}
