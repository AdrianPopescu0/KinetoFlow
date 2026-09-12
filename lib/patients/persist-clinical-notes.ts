import "server-only"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

import { privilegedClinicClient } from "@/lib/clinics/members"
import { fetchPatientFileSnapshot, type PatientFileSnapshot } from "@/lib/patients/optimistic"
import { readPatientIdFromSavePayload } from "@/lib/patients/patient-id"
import { upsertPatientNotes } from "@/lib/patients/patient-notes"
import { getOwnPatientRow } from "@/lib/patients/tenant"

export type PersistClinicalNotesResult =
  | { ok: true; updated_at: string | null }
  | { ok: false; error: string; unauthorized?: boolean; conflict?: boolean; current?: PatientFileSnapshot | null }

export async function persistClinicalNotesForTherapist(input: {
  supabase: SupabaseClient
  userId: string
  patientId?: string | null
  patient_id?: string | null
  notes: string
  expectedUpdatedAt?: string | null
  forceOverwrite?: boolean
}): Promise<PersistClinicalNotesResult> {
  const patientId = readPatientIdFromSavePayload(input)
  if (!patientId) {
    return { ok: false, error: "Pacientul nu a fost găsit." }
  }

  const owned = await getOwnPatientRow(input.supabase, input.userId, patientId, "id")
  if (!owned.data) {
    return { ok: false, error: "Pacientul nu a fost găsit." }
  }

  const client = await privilegedClinicClient(input.supabase)
  const trimmed = input.notes.trim().length > 0 ? input.notes : null
  const result = await upsertPatientNotes(client, patientId, trimmed, {
    expectedUpdatedAt: input.expectedUpdatedAt ?? null,
    forceOverwrite: input.forceOverwrite === true,
    updatedBy: input.userId,
  })

  if (!result.ok) {
    if (result.conflict) {
      const current = await fetchPatientFileSnapshot(input.supabase, input.userId, patientId)
      return {
        ok: false,
        error: "",
        conflict: true,
        current: current
          ? {
              ...current,
              clinical_notes: result.currentNotes ?? current.clinical_notes,
              updated_at: result.currentUpdatedAt ?? current.updated_at,
            }
          : {
              full_name: "",
              email: null,
              phone: null,
              diagnosis: null,
              clinical_notes: result.currentNotes ?? null,
              updated_at: result.currentUpdatedAt ?? null,
            },
      }
    }
    return { ok: false, error: result.error }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return { ok: true, updated_at: result.updated_at }
}
