import { Activity, AlertTriangle, ClipboardCheck, Users } from "lucide-react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import type { DashboardStats } from "@/lib/patients/types-db"

const CARDS = [
  { key: "activePatients", label: "Pacienți activi", icon: Users },
  { key: "checkInsToday", label: "Check-in-uri azi", icon: ClipboardCheck },
  { key: "painAlerts", label: "Alerte durere VAS ≥ 7", icon: AlertTriangle },
  { key: "compliancePercent", label: "Complianță (7 zile)", icon: Activity },
] as const

export function DashboardStats({ stats }: { stats: DashboardStats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const Icon = card.icon
        const value =
          card.key === "compliancePercent" ? `${stats[card.key]}%` : String(stats[card.key])
        return (
          <article key={card.key} className={surfaceCardClassName("flex items-start gap-3 p-4")}>
            <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {card.label}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-800">{value}</p>
            </div>
          </article>
        )
      })}
    </section>
  )
}
