import { startOfTodayIso } from "@/lib/patients/display"
import type { PatientListItem } from "@/lib/patients/types-db"

export type PatientListFilter = "all" | "checkins" | "alert" | "compliance" | "silent"

export const COMPLIANCE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

export function bucharestDateKey(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso))
}

export function isLowCompliance(patient: PatientListItem, now = Date.now()): boolean {
  if (!patient.lastCheckInAt) {
    return true
  }
  return new Date(patient.lastCheckInAt).getTime() < now - COMPLIANCE_WINDOW_MS
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
    return bucharestDateKey(patient.lastCheckInAt) === startOfTodayIso().slice(0, 10)
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
