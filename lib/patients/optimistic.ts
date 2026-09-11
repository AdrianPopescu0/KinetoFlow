import type { SupabaseClient } from "@supabase/supabase-js"

import { getOwnPatientRow } from "@/lib/patients/tenant"
import { readPatientRecordId } from "@/lib/patients/patient-id"

export type PatientFileSnapshot = {
  full_name: string
  email: string | null
  phone: string | null
  diagnosis: string | null
  clinical_notes: string | null
  updated_at: string | null
}

const SNAPSHOT_COLUMNS =
  "id, full_name, email, phone, diagnosis, clinical_notes, updated_at"
const SNAPSHOT_COLUMNS_LEGACY = "id, full_name, email, phone, diagnosis, clinical_notes"
const SNAPSHOT_COLUMNS_MINIMAL = "id, full_name, email, phone, diagnosis"

export function isWriteConflict(
  expectedUpdatedAt: string | null | undefined,
  currentUpdatedAt: string | null | undefined,
): boolean {
  if (!expectedUpdatedAt || !currentUpdatedAt) {
    return false
  }
  const expectedMs = Date.parse(expectedUpdatedAt)
  const currentMs = Date.parse(currentUpdatedAt)
  if (Number.isFinite(expectedMs) && Number.isFinite(currentMs)) {
    return expectedMs !== currentMs
  }
  return expectedUpdatedAt !== currentUpdatedAt
}

export function snapshotFromRow(row: Record<string, unknown>): PatientFileSnapshot {
  return {
    full_name: String(row.full_name ?? ""),
    email: typeof row.email === "string" ? row.email : null,
    phone: typeof row.phone === "string" ? row.phone : null,
    diagnosis: typeof row.diagnosis === "string" ? row.diagnosis : null,
    clinical_notes: typeof row.clinical_notes === "string" ? row.clinical_notes : null,
    updated_at: typeof row.updated_at === "string" ? row.updated_at : null,
  }
}

export async function fetchPatientFileSnapshot(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
): Promise<PatientFileSnapshot | null> {
  const resolvedId = readPatientRecordId(patientId)
  if (!resolvedId) {
    return null
  }

  const attempts = [SNAPSHOT_COLUMNS, SNAPSHOT_COLUMNS_LEGACY, SNAPSHOT_COLUMNS_MINIMAL]
  for (const columns of attempts) {
    const result = await getOwnPatientRow(supabase, userId, resolvedId, columns)
    if (!result.error && result.data) {
      return snapshotFromRow(result.data)
    }
    if (result.data) {
      return snapshotFromRow(result.data)
    }
  }
  return null
}
