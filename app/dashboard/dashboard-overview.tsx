"use client"

import { useState } from "react"

import { DashboardStats } from "@/app/dashboard/dashboard-stats"
import { PatientList } from "@/app/dashboard/patient-list"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import type { PatientListFilter } from "@/lib/patients/dashboard-filter"
import type { DashboardStats as DashboardStatsData, PatientListItem } from "@/lib/patients/types-db"

export function DashboardOverview({
  patients,
  stats,
}: {
  patients: PatientListItem[]
  stats: DashboardStatsData
}) {
  const [filter, setFilter] = useState<PatientListFilter>("all")

  function selectMetric(next: PatientListFilter) {
    if (next === "all") {
      setFilter("all")
      return
    }
    setFilter((current) => (current === next ? "all" : next))
  }

  return (
    <>
      <DashboardStats stats={stats} filter={filter} onSelect={selectMetric} />

      <section className={surfaceCardClassName("overflow-hidden")}>
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-800">Listă pacienți</h2>
          <p className="text-sm text-slate-600">
            Caută, apasă un card de metrici sau filtrează după ultimul scor VAS.
          </p>
        </div>
        <PatientList patients={patients} filter={filter} onFilterChange={setFilter} />
      </section>
    </>
  )
}
