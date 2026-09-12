const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const PATIENT_FILE_PATH = /\/dashboard\/patients\/([^/?#]+)/i

export function isPatientRecordId(value: string): boolean {
  return UUID_PATTERN.test(value.trim())
}

function decodeCandidate(value: string): string {
  const trimmed = value.trim()
  try {
    return decodeURIComponent(trimmed)
  } catch {
    return trimmed
  }
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
      const id = decodeCandidate(value)
      if (isPatientRecordId(id)) {
        return id
      }
      continue
    }
    if (Array.isArray(value)) {
      const nested = readPatientRecordId(...value)
      if (nested) {
        return nested
      }
      continue
    }
    if (value && typeof value === "object") {
      const nested = readFromObject(value)
      if (nested) {
        return nested
      }
    }
  }
  return null
}

/** UUID din `/dashboard/patients/[id]`. */
export function readPatientIdFromPathname(pathname: unknown): string | null {
  if (typeof pathname !== "string" || pathname.length === 0) {
    return null
  }
  const match = pathname.match(PATIENT_FILE_PATH)
  if (!match?.[1]) {
    return null
  }
  return readPatientRecordId(match[1])
}

/**
 * ID-ul fișei: props (`patientId` / `patient_id`), `useParams().id`, apoi pathname.
 * Folosit la click pe „Salvează nota”.
 */
export function readPatientIdFromRouteOrProps(input: {
  patientId?: unknown
  patient_id?: unknown
  paramsId?: unknown
  params?: unknown
  pathname?: unknown
}): string | null {
  return readPatientRecordId(
    input.patient_id,
    input.patientId,
    input.paramsId,
    input.params,
    readPatientIdFromPathname(input.pathname),
  )
}

/** Extrage `patient_id` din payload-ul trimis la Server Action / API. */
export function readPatientIdFromSavePayload(payload: {
  patientId?: unknown
  patient_id?: unknown
  id?: unknown
}): string | null {
  return readPatientRecordId(payload.patient_id, payload.patientId, payload.id)
}

/**
 * Primul argument al Server Action (string legat pe server sau din click)
 * plus payload/FormData. Nu acceptă gol / undefined.
 */
export function readPatientIdFromSaveArgs(patient_id: unknown, payload?: unknown): string | null {
  if (payload instanceof FormData) {
    return readPatientRecordId(
      patient_id,
      payload.get("patient_id"),
      payload.get("patientId"),
      payload.get("id"),
    )
  }
  return readPatientRecordId(patient_id, payload)
}
