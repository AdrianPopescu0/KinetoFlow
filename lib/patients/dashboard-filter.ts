import type { PatientListItem } from "./types-db.ts"
import { isLowRealFrequency } from "./compliance.ts"
import { isHighPainVas } from "./vas-history.ts"
import { bucharestDateKey, isBucharestToday } from "../time/bucharest.ts"

export type PatientListFilter = "all" | "checkins" | "compliance" | "silent"

export type PatientAssignmentScope = "mine" | "clinic"

export const PATIENT_SCOPE_STORAGE_KEY = "kinetoflow:dashboard-patient-scope"

export { bucharestDateKey }

export function isLowCompliance(patient: PatientListItem): boolean {
  return isLowRealFrequency(patient.activeDaysLast7, patient.frequencyWindowDays)
}

export function patientMatchesAssignmentScope(
  patient: PatientListItem,
  scope: PatientAssignmentScope,
  therapistId: string,
): boolean {
  if (scope === "clinic") {
    return true
  }
  return patient.assigned_therapist_id === therapistId
}

export function patientMatchesListFilter(
  patient: PatientListItem,
  filter: PatientListFilter,
): boolean {
  if (filter === "all") {
    return true
  }
  if (filter === "silent") {
    return patient.lastVas === null
  }
  if (filter === "checkins") {
    // Lista principală e înlocuită de split Completat / În așteptare.
    return true
  }
  if (filter === "compliance") {
    return isLowCompliance(patient)
  }
  return true
}

export function comparePatientsForList(left: PatientListItem, right: PatientListItem): number {
  const leftAlert = isHighPainVas(left.lastVas)
  const rightAlert = isHighPainVas(right.lastVas)
  if (leftAlert !== rightAlert) {
    return leftAlert ? -1 : 1
  }
  if (leftAlert && rightAlert) {
    const vasDiff = (right.lastVas ?? 0) - (left.lastVas ?? 0)
    if (vasDiff !== 0) {
      return vasDiff
    }
  }
  return left.full_name.localeCompare(right.full_name, "ro")
}

export function sortPatientsForList(patients: PatientListItem[]): PatientListItem[] {
  return [...patients].sort(comparePatientsForList)
}

export function emptyFilterMessage(filter: PatientListFilter): string {
  switch (filter) {
    case "checkins":
      return "Nu există pacienți în vizualizarea de check-in de azi."
    case "compliance":
      return "Niciun pacient cu frecvență scăzută (sub jumătate din zilele active din ultimele 7)."
    case "silent":
      return "Toți pacienții au cel puțin un check-in."
    default:
      return "Nu am găsit pacienți pentru filtrul selectat."
  }
}

export function patientHasCheckInToday(patient: PatientListItem, now = new Date()): boolean {
  if (!patient.lastCheckInAt) {
    return false
  }
  return isBucharestToday(patient.lastCheckInAt, now)
}

export function splitPatientsByTodayCheckIn(
  patients: PatientListItem[],
  now = new Date(),
): { completed: PatientListItem[]; pending: PatientListItem[] } {
  const completed: PatientListItem[] = []
  const pending: PatientListItem[] = []

  for (const patient of patients) {
    if (patientHasCheckInToday(patient, now)) {
      completed.push(patient)
    } else {
      pending.push(patient)
    }
  }

  completed.sort((left, right) => (right.lastCheckInAt ?? "").localeCompare(left.lastCheckInAt ?? ""))
  pending.sort((left, right) => left.full_name.localeCompare(right.full_name, "ro"))

  return { completed, pending }
}

export function emptyAssignmentScopeMessage(scope: PatientAssignmentScope): string {
  if (scope === "mine") {
    return "Nu ai pacienți asignați. Comută pe „Toți pacienții cabinetului” sau adaugă un pacient nou."
  }
  return "Nu există pacienți în acest cabinet."
}
