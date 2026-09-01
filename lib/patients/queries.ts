import { createClient } from "@/utils/supabase/server"
import type { PatientRecord } from "@/lib/patients/types-db"

export async function listTherapistPatients(): Promise<{
  patients: PatientRecord[]
  error: string | null
  needsMigration: boolean
}> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("patients")
    .select("id, therapist_id, full_name, email, phone, diagnosis, token, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    const needsMigration =
      error.message.includes("schema cache") ||
      error.message.includes("does not exist") ||
      error.code === "42P01" ||
      error.code === "PGRST205"

    return {
      patients: [],
      error: needsMigration
        ? "Tabela patients nu există încă. Rulează supabase/migrations/001_patients.sql în SQL Editor."
        : "Nu am putut încărca pacienții. Încearcă din nou.",
      needsMigration,
    }
  }

  return {
    patients: (data ?? []) as PatientRecord[],
    error: null,
    needsMigration: false,
  }
}
