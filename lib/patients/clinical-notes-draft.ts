const DRAFT_PREFIX = "kinetoflow:clinical-notes-draft:"

export type ClinicalNotesDraft = {
  notes: string
  updatedAt: number
}

export function clinicalNotesDraftKey(patientId: string): string {
  return `${DRAFT_PREFIX}${patientId}`
}

export function readClinicalNotesDraft(patientId: string): ClinicalNotesDraft | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const raw = window.localStorage.getItem(clinicalNotesDraftKey(patientId))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as ClinicalNotesDraft
    if (typeof parsed.notes !== "string" || typeof parsed.updatedAt !== "number") {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeClinicalNotesDraft(patientId: string, notes: string): ClinicalNotesDraft {
  const draft: ClinicalNotesDraft = { notes, updatedAt: Date.now() }
  try {
    window.localStorage.setItem(clinicalNotesDraftKey(patientId), JSON.stringify(draft))
  } catch {
    // Quota / private mode — keep working in memory
  }
  return draft
}

export function clearClinicalNotesDraft(patientId: string): void {
  try {
    window.localStorage.removeItem(clinicalNotesDraftKey(patientId))
  } catch {
    // ignore
  }
}

export function initialClinicalNotes(patientId: string, serverNotes: string): string {
  const draft = readClinicalNotesDraft(patientId)
  if (draft && draft.notes !== serverNotes) {
    return draft.notes
  }
  return serverNotes
}
