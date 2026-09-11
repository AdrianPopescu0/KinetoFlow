import "server-only"

import { revalidatePath } from "next/cache"
import type { SupabaseClient } from "@supabase/supabase-js"

import { listClinicMemberUserIds, privilegedClinicClient } from "@/lib/clinics/members"
import { fetchPatientFileSnapshot, isWriteConflict, type PatientFileSnapshot } from "@/lib/patients/optimistic"
import { readPatientIdFromSavePayload } from "@/lib/patients/patient-id"

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

  const snapshot = await fetchPatientFileSnapshot(input.supabase, input.userId, patientId)
  if (!snapshot) {
    return { ok: false, error: "Pacientul nu a fost găsit." }
  }

  const expected = input.expectedUpdatedAt ?? null
  if (!input.forceOverwrite && isWriteConflict(expected, snapshot.updated_at)) {
    return { ok: false, error: "", conflict: true, current: snapshot }
  }

  const trimmed = input.notes.trim().length > 0 ? input.notes : null
  const memberIds = await listClinicMemberUserIds(input.supabase, input.userId)
  const client = await privilegedClinicClient(input.supabase)

  let update = client
    .from("patients")
    .update({ clinical_notes: trimmed })
    .eq("id", patientId)
    .in("therapist_id", memberIds)

  if (!input.forceOverwrite && expected && snapshot.updated_at) {
    update = update.eq("updated_at", snapshot.updated_at)
  }

  const { data, error } = await update.select("id, updated_at")

  if (error || !data || data.length === 0) {
    if (!input.forceOverwrite && expected) {
      const latest = await fetchPatientFileSnapshot(input.supabase, input.userId, patientId)
      if (latest && isWriteConflict(expected, latest.updated_at)) {
        return { ok: false, error: "", conflict: true, current: latest }
      }
    }

    const fallback = await client
      .from("patients")
      .update({ clinical_notes: trimmed })
      .eq("id", patientId)
      .in("therapist_id", memberIds)
      .select("id, updated_at")

    if (fallback.error) {
      return { ok: false, error: fallback.error.message }
    }
    if (!fallback.data || fallback.data.length === 0) {
      return { ok: false, error: "Nu am putut salva notițele." }
    }

    revalidatePath("/dashboard")
    revalidatePath(`/dashboard/patients/${patientId}`)
    return {
      ok: true,
      updated_at: typeof fallback.data[0]?.updated_at === "string" ? fallback.data[0].updated_at : null,
    }
  }

  revalidatePath("/dashboard")
  revalidatePath(`/dashboard/patients/${patientId}`)
  return {
    ok: true,
    updated_at: typeof data[0]?.updated_at === "string" ? data[0].updated_at : null,
  }
}
