import type { PatientListItem } from "@/lib/patients/types-db"
import { bucharestDateKey, isBucharestToday } from "@/lib/time/bucharest"

export type PatientListFilter = "all" | "checkins" | "alert" | "compliance" | "silent"

export type PatientAssignmentScope = "mine" | "clinic"

export const PATIENT_SCOPE_STORAGE_KEY = "kinetoflow:dashboard-patient-scope"

export const COMPLIANCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export { bucharestDateKey }

export function isLowCompliance(patient: PatientListItem, now = Date.now()): boolean {
  if (!patient.lastCheckInAt) {
    return true
  }
  return new Date(patient.lastCheckInAt).getTime() < now - COMPLIANCE_WINDOW_MS
}

export function patientMatchesAssignmentScope(
  patient: PatientListItem,
  scope: PatientAssignmentScope,
  therapistId: string,
): boolean {
  if (scope === "clinic") {
    return true
  }
  return patient.therapist_id === therapistId || patient.assigned_therapist_id === therapistId
}

export function patientMatchesListFilter(
  patient: PatientListItem,
  filter: PatientListFilter,
  now = Date.now(),
): boolean {
  if (filter === "all") {
    return true
  }
  if (filter === "alert") {
    return (patient.lastVas ?? 0) >= 7
  }
  if (filter === "silent") {
    return patient.lastVas === null
  }
  if (filter === "checkins") {
    if (!patient.lastCheckInAt) {
      return false
    }
    return isBucharestToday(patient.lastCheckInAt, new Date(now))
  }
  if (filter === "compliance") {
    return isLowCompliance(patient, now)
  }
  return true
}

export function emptyFilterMessage(filter: PatientListFilter): string {
  switch (filter) {
    case "alert":
      return "Niciun pacient cu VAS ≥ 7 momentan."
    case "checkins":
      return "Niciun pacient nu a completat un check-in azi."
    case "compliance":
      return "Niciun pacient cu complianță scăzută (fără check-in în ultimele 7 zile)."
    case "silent":
      return "Toți pacienții au cel puțin un check-in."
    default:
      return "Nu am găsit pacienți pentru filtrul selectat."
  }
}

export function emptyAssignmentScopeMessage(scope: PatientAssignmentScope): string {
  if (scope === "mine") {
    return "Nu ai pacienți asignați. Comută pe „Toți pacienții cabinetului” sau adaugă un pacient nou."
  }
  return "Nu există pacienți în acest cabinet."
}
