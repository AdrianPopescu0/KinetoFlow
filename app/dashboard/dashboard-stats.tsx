"use client"

import { memo } from "react"
import { AlertTriangle, CalendarDays, ClipboardCheck, Users } from "lucide-react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { formatRealFrequency } from "@/lib/patients/compliance"
import type { PatientListFilter } from "@/lib/patients/dashboard-filter"
import type { DashboardStats as DashboardStatsData } from "@/lib/patients/types-db"
import { cn } from "@/lib/utils"

const CARDS = [
  { key: "all", statKey: "activePatients", label: "Pacienți activi", icon: Users },
  { key: "checkins", statKey: "checkInsToday", label: "Check-in-uri azi", icon: ClipboardCheck },
  { key: "alert", statKey: "painAlerts", label: "Alerte durere VAS ≥ 7", icon: AlertTriangle },
  { key: "compliance", statKey: "realFrequency", label: "Frecvență reală", icon: CalendarDays },
] as const satisfies ReadonlyArray<{
  key: PatientListFilter
  statKey: "activePatients" | "checkInsToday" | "painAlerts" | "realFrequency"
  label: string
  icon: typeof Users
}>

export const DashboardStats = memo(function DashboardStats({
  stats,
  filter,
  onSelect,
}: {
  stats: DashboardStatsData
  filter: PatientListFilter
  onSelect: (filter: PatientListFilter) => void
}) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        const value =
          card.statKey === "realFrequency"
            ? formatRealFrequency(stats.realFrequencyActiveDays, stats.realFrequencyWindowDays)
            : String(stats[card.statKey])
        const selected = filter === card.key && card.key !== "all"

        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            aria-pressed={selected}
            className={cn(
              surfaceCardClassName(
                "flex cursor-pointer items-start gap-3 p-4 text-left transition-all hover:scale-[1.01] hover:border-teal-500",
              ),
              selected
                ? "border-teal-600 bg-teal-50/70 ring-2 ring-teal-500/70"
                : "hover:bg-white",
            )}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{card.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-800">{value}</p>
              {card.statKey === "realFrequency" ? (
                <p className="mt-0.5 text-xs text-slate-500">zile active din ultimele 7</p>
              ) : null}
            </div>
          </button>
        )
      })}
    </section>
  )
})
