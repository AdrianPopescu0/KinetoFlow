import type { Exercise, PatientProgram } from "@/lib/patients/types"
import type { ExerciseRecord, PatientRecord } from "@/lib/patients/types-db"
import { listCompletedExerciseIdsForDay } from "@/lib/patients/exercise-completions"
import { youtubeIdFromUrl } from "@/lib/patients/youtube"
import { bucharestDateKey } from "@/lib/time/bucharest"
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
      .select("id, therapist_id, full_name, diagnosis, token")
      .eq("token", token)
      .maybeSingle()

    if (error || !patient) {
      return null
    }

    const record = patient as Pick<
      PatientRecord,
      "id" | "therapist_id" | "full_name" | "diagnosis" | "token"
    >
    const { data: exerciseRows } = await supabase
      .from("exercises")
      .select("id, patient_id, title, video_url, sets, reps, notes")
      .eq("patient_id", record.id)

    const exercises = mapExercises((exerciseRows ?? []) as ExerciseRecord[])
    const therapist = await loadTherapistProfile(supabase, record.therapist_id)
    const completedExerciseIdsToday = await listCompletedExerciseIdsForDay(
      supabase,
      record.id,
      bucharestDateKey(),
    )

    const doneCount = completedExerciseIdsToday.filter((id) =>
      exercises.some((exercise) => exercise.id === id),
    ).length
    const progressPercent =
      exercises.length === 0 ? 0 : Math.round((doneCount / exercises.length) * 100)

    return {
      token: record.token,
      patientId: record.id,
      firstName: firstNameFromFullName(record.full_name),
      fullName: record.full_name,
      programLabel: record.diagnosis?.trim() || "Programul tău de recuperare",
      progressPercent: Math.max(progressPercent, exercises.length > 0 ? 5 : 0),
      exercises,
      completedExerciseIdsToday,
      therapistName: therapist.name,
      therapistPhone: therapist.phone,
    }
  } catch {
    return null
  }
}

async function loadTherapistProfile(
  supabase: ReturnType<typeof createServiceRoleClient>,
  therapistId: string,
): Promise<{ name: string; phone: string | null }> {
  try {
    const { data: clinic } = await supabase
      .from("clinic_profiles")
      .select("therapist_name, phone")
      .eq("user_id", therapistId)
      .maybeSingle()

    if (clinic && typeof clinic.therapist_name === "string") {
      const digits = String(clinic.phone ?? "").replace(/\D/g, "")
      return {
        name: clinic.therapist_name.trim() || "Kinetoterapeutul tău",
        phone: digits.length >= 8 ? digits : null,
      }
    }

    const { data, error } = await supabase.auth.admin.getUserById(therapistId)
    if (error || !data.user) {
      return { name: "Kinetoterapeutul tău", phone: null }
    }

    const meta = data.user.user_metadata ?? {}
    const fromMeta =
      (typeof meta.full_name === "string" && meta.full_name.trim()) ||
      (typeof meta.name === "string" && meta.name.trim()) ||
      ""
    const name = fromMeta || data.user.email?.split("@")[0] || "Kinetoterapeutul tău"
    const phoneRaw = typeof meta.phone === "string" ? meta.phone : data.user.phone
    const digits = phoneRaw?.replace(/\D/g, "") ?? ""

    return { name, phone: digits.length >= 8 ? digits : null }
  } catch {
    return { name: "Kinetoterapeutul tău", phone: null }
  }
}
