"use client"

import { useCallback, useState } from "react"

import { DashboardStats } from "@/app/dashboard/dashboard-stats"
import { PatientList } from "@/app/dashboard/patient-list"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import type { PatientListFilter } from "@/lib/patients/dashboard-filter"
import type { DashboardStats as DashboardStatsData, PatientListItem } from "@/lib/patients/types-db"

export function DashboardOverview({
  patients,
  stats,
  currentTherapistId,
  therapists,
}: {
  patients: PatientListItem[]
  stats: DashboardStatsData
  currentTherapistId: string
  therapists: ClinicTherapistOption[]
}) {
  const [filter, setFilter] = useState<PatientListFilter>("all")

  const selectMetric = useCallback((next: PatientListFilter) => {
    if (next === "all") {
      setFilter("all")
      return
    }
    setFilter((current) => (current === next ? "all" : next))
  }, [])

  return (
    <>
      <DashboardStats stats={stats} filter={filter} onSelect={selectMetric} />

      <section className={surfaceCardClassName("overflow-hidden")}>
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">
            {filter === "checkins" ? "Check-in-uri azi" : "Listă pacienți"}
          </h2>
          <p className="text-sm text-slate-600">
            {filter === "checkins"
              ? "Cine a trimis formularul azi și cine e încă în așteptare, după vizualizarea selectată."
              : "Toți pacienții rămân în listă. Durerea mare (VAS ≥ 7) e evidențiată și urcă primele. Apasă un rând pentru graficul VAS."}
          </p>
        </div>
        <PatientList
          patients={patients}
          filter={filter}
          currentTherapistId={currentTherapistId}
          therapists={therapists}
        />
      </section>
    </>
  )
}
