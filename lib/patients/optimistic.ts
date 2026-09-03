import type { SupabaseClient } from "@supabase/supabase-js"

import { getOwnPatientRow } from "@/lib/patients/tenant"

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

function looksLikeMissingUpdatedAt(error: { message?: string; code?: string } | null): boolean {
  if (!error?.message) {
    return false
  }
  const message = error.message.toLowerCase()
  return message.includes("updated_at")
}

export async function fetchPatientFileSnapshot(
  supabase: SupabaseClient,
  userId: string,
  patientId: string,
  clinicId: string,
): Promise<PatientFileSnapshot | null> {
  const stamped = await getOwnPatientRow(supabase, userId, patientId, SNAPSHOT_COLUMNS, clinicId)
  if (!stamped.error && stamped.data) {
    return snapshotFromRow(stamped.data)
  }
  if (stamped.error && looksLikeMissingUpdatedAt(stamped.error)) {
    const legacy = await getOwnPatientRow(supabase, userId, patientId, SNAPSHOT_COLUMNS_LEGACY, clinicId)
    if (!legacy.error && legacy.data) {
      return snapshotFromRow(legacy.data)
    }
  }
  if (!stamped.data) {
    const legacy = await getOwnPatientRow(supabase, userId, patientId, SNAPSHOT_COLUMNS_LEGACY, clinicId)
    if (!legacy.error && legacy.data) {
      return snapshotFromRow(legacy.data)
    }
  }
  return null
}
