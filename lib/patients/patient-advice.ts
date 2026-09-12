import type { SupabaseClient } from "@supabase/supabase-js"

import { readPatientRecordId } from "./patient-id.ts"
import { isMissingSchemaObject } from "./schema-error.ts"

export const PATIENT_ADVICE_SQL = "sql/032_patient_advice.sql"
export const PATIENT_ADVICE_MAX_LENGTH = 2000
export const DEFAULT_THERAPIST_CARD_COPY =
  "Scrie dacă un exercițiu doare altfel decât de obicei sau dacă nu ești sigur de doză."

export const MISSING_PATIENT_ADVICE_ERROR =
  "Tabela patient_advice lipsește. Rulează sql/032_patient_advice.sql în Supabase → SQL Editor, apoi salvează din nou."

export function isMissingPatientAdviceTable(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  return isMissingSchemaObject(error, "patient_advice")
}

export function normalizePatientAdvice(value: unknown): string {
  if (typeof value !== "string") {
    return ""
  }
  return value.replace(/\r\n/g, "\n").trim().slice(0, PATIENT_ADVICE_MAX_LENGTH)
}

export function displayTherapistAdvice(value: unknown): string {
  return normalizePatientAdvice(value) || DEFAULT_THERAPIST_CARD_COPY
}

export async function fetchPatientAdvice(
  supabase: SupabaseClient,
  patientId: string,
): Promise<string> {
  const id = readPatientRecordId(patientId)
  if (!id) {
    return ""
  }

  const fromTable = await supabase
    .from("patient_advice")
    .select("message")
    .eq("patient_id", id)
    .maybeSingle()

  if (!fromTable.error) {
    return normalizePatientAdvice(fromTable.data?.message)
  }

  if (!isMissingPatientAdviceTable(fromTable.error) && !isMissingSchemaObject(fromTable.error, "message")) {
    console.error("[patient_advice] load", fromTable.error.message)
  }

  const fromColumn = await supabase.from("patients").select("therapist_advice").eq("id", id).maybeSingle()
  if (!fromColumn.error) {
    return normalizePatientAdvice((fromColumn.data as { therapist_advice?: unknown } | null)?.therapist_advice)
  }

  return ""
}

export async function upsertPatientAdvice(
  supabase: SupabaseClient,
  patientId: string,
  message: unknown,
): Promise<{ error: string | null }> {
  const id = readPatientRecordId(patientId)
  if (!id) {
    return { error: "Pacientul nu a fost găsit." }
  }

  const normalized = normalizePatientAdvice(message)
  const stored = normalized.length > 0 ? normalized : null
  const stamp = new Date().toISOString()

  const tableWrite = await supabase
    .from("patient_advice")
    .upsert({ patient_id: id, message: stored, updated_at: stamp }, { onConflict: "patient_id" })

  if (!tableWrite.error) {
    return { error: null }
  }

  if (!isMissingPatientAdviceTable(tableWrite.error)) {
    return { error: "Nu am putut salva mesajul pentru pacient." }
  }

  const columnWrite = await supabase
    .from("patients")
    .update({ therapist_advice: stored })
    .eq("id", id)

  if (!columnWrite.error) {
    return { error: null }
  }

  if (isMissingSchemaObject(columnWrite.error, "therapist_advice")) {
    return { error: MISSING_PATIENT_ADVICE_ERROR }
  }

  return { error: "Nu am putut salva mesajul pentru pacient." }
}
