import type { SupabaseClient } from "@supabase/supabase-js"

import { isWriteConflict } from "@/lib/patients/optimistic"
import { isMissingPatientNotesTable } from "@/lib/patients/schema-error"

export const PATIENT_NOTES_SQL = "sql/030_patient_notes.sql"

export const MISSING_PATIENT_NOTES_TABLE_ERROR =
  "Tabela patient_notes lipsește. Rulează sql/030_patient_notes.sql în Supabase → SQL Editor, apoi salvează din nou."

export type PatientNotesRow = {
  patient_id: string
  notes: string | null
  updated_at: string | null
}

export async function fetchPatientNotes(
  supabase: SupabaseClient,
  patientId: string,
): Promise<PatientNotesRow | null> {
  const { data, error } = await supabase
    .from("patient_notes")
    .select("patient_id, notes, updated_at")
    .eq("patient_id", patientId)
    .maybeSingle()

  if (error) {
    if (isMissingPatientNotesTable(error)) {
      return null
    }
    return null
  }
  if (!data) {
    return { patient_id: patientId, notes: null, updated_at: null }
  }
  return {
    patient_id: String(data.patient_id ?? patientId),
    notes: typeof data.notes === "string" ? data.notes : null,
    updated_at: typeof data.updated_at === "string" ? data.updated_at : null,
  }
}

export async function upsertPatientNotes(
  supabase: SupabaseClient,
  patientId: string,
  notes: string | null,
  options?: { expectedUpdatedAt?: string | null; forceOverwrite?: boolean },
): Promise<
  | { ok: true; updated_at: string | null }
  | { ok: false; error: string; missingTable?: boolean; conflict?: boolean; currentNotes?: string | null; currentUpdatedAt?: string | null }
> {
  const existing = await fetchPatientNotes(supabase, patientId)
  const expected = options?.expectedUpdatedAt ?? null
  if (!options?.forceOverwrite && existing && isWriteConflict(expected, existing.updated_at)) {
    return {
      ok: false,
      error: "",
      conflict: true,
      currentNotes: existing.notes,
      currentUpdatedAt: existing.updated_at,
    }
  }

  const stamp = new Date().toISOString()
  const { data, error } = await supabase
    .from("patient_notes")
    .upsert(
      { patient_id: patientId, notes, updated_at: stamp },
      { onConflict: "patient_id" },
    )
    .select("patient_id, notes, updated_at")
    .maybeSingle()

  if (error) {
    if (isMissingPatientNotesTable(error)) {
      return { ok: false, error: MISSING_PATIENT_NOTES_TABLE_ERROR, missingTable: true }
    }
    return { ok: false, error: error.message }
  }

  return {
    ok: true,
    updated_at: typeof data?.updated_at === "string" ? data.updated_at : stamp,
  }
}
