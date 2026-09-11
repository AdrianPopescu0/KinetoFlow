const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isPatientRecordId(value: string): boolean {
  return UUID_PATTERN.test(value.trim())
}

function readFromObject(value: object): string | null {
  if (!("patientId" in value || "patient_id" in value || "id" in value)) {
    return null
  }
  const record = value as { patientId?: unknown; patient_id?: unknown; id?: unknown }
  return readPatientRecordId(record.patientId, record.patient_id, record.id)
}

/** Primul UUID valid din props, payload (`patient_id` / `patientId`) sau segmentul de rută. */
export function readPatientRecordId(...candidates: unknown[]): string | null {
  for (const value of candidates) {
    if (typeof value === "string") {
      const id = value.trim()
      if (isPatientRecordId(id)) {
        return id
      }
      continue
    }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const nested = readFromObject(value)
      if (nested) {
        return nested
      }
    }
  }
  return null
}

/** Extrage `patient_id` din payload-ul trimis la Server Action / API. */
export function readPatientIdFromSavePayload(payload: {
  patientId?: unknown
  patient_id?: unknown
  id?: unknown
}): string | null {
  return readPatientRecordId(payload.patientId, payload.patient_id, payload.id)
}
