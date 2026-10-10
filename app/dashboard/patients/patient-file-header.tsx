import type { ReactNode } from "react"
import { Activity, CalendarDays, ClipboardList, Hash, Megaphone } from "lucide-react"

import { vasBadgeClass } from "@/lib/patients/display"
import { notifyChannelLabel } from "@/lib/patients/notify-channel"
import type { PatientFileHeaderSummary } from "@/lib/patients/queries"
import type { PatientRecord } from "@/lib/patients/types-db"
import { cn } from "@/lib/utils"

function formatRoDate(value: string | null | undefined, withTime = false): string {
  if (!value) {
    return "—"
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleString("ro-RO", {
    timeZone: "Europe/Bucharest",
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime
      ? { hour: "2-digit", minute: "2-digit" }
      : {}),
  })
}

function MetaTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof CalendarDays
  label: string
  value: ReactNode
  hint?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 dark:border-[var(--kf-border)] dark:bg-slate-900/55">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-slate-100">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  )
}

export function PatientFileHeader({
  patient,
  summary,
  actions,
}: {
  patient: PatientRecord
  summary: PatientFileHeaderSummary
  actions: ReactNode
}) {
  const archived = Boolean(patient.archived_at)
  const treatmentLabel =
    summary.exerciseCount === 0
      ? "Fără plan"
      : summary.exerciseCount === 1
        ? "1 exercițiu"
        : `${summary.exerciseCount} exerciții`

  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase dark:text-teal-300">
          Fișa pacientului
        </p>
        <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            {patient.full_name}
          </h1>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              archived
                ? "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600"
                : "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-800",
            )}
          >
            {archived ? "Arhivat" : "Activ"}
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="font-medium text-slate-800 dark:text-slate-100">Diagnostic:</span>{" "}
          {patient.diagnosis || "—"}
        </p>
        <p className="mt-1 break-words text-sm text-slate-600 dark:text-slate-300">
          {patient.email || "Fără email"} · {patient.phone || "Fără telefon"}
        </p>
        {patient.access_code ? (
          <p className="mt-2 font-mono text-lg font-semibold tracking-[0.18em] text-slate-900 dark:text-slate-100">
            Cod acces: {patient.access_code}
          </p>
        ) : null}
      </div>

      <aside className="flex w-full min-w-0 flex-col gap-3 lg:w-[22.5rem] lg:shrink-0">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-2">
          <MetaTile
            icon={CalendarDays}
            label="Ultima evaluare"
            value={summary.lastCheckInAt ? formatRoDate(summary.lastCheckInAt, true) : "Fără check-in"}
            hint={summary.lastCheckInAt ? "Ultimul check-in VAS" : "Nicio evaluare înregistrată"}
          />
          <MetaTile
            icon={Activity}
            label="Ultimul VAS"
            value={
              summary.lastVas === null ? (
                "—"
              ) : (
                <span
                  className={cn(
                    "inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset",
                    vasBadgeClass(summary.lastVas),
                  )}
                >
                  VAS {summary.lastVas}
                </span>
              )
            }
            hint={summary.lastVas === null ? "Fără scor recent" : "Scala durerii 0–10"}
          />
          <MetaTile
            icon={ClipboardList}
            label="Plan tratament"
            value={treatmentLabel}
            hint={summary.exerciseCount > 0 ? "Exerciții atribuite" : "Atribuie din bibliotecă"}
          />
          <MetaTile
            icon={Hash}
            label="În clinică din"
            value={formatRoDate(patient.created_at)}
            hint={
              patient.updated_at
                ? `Actualizat ${formatRoDate(patient.updated_at, true)}`
                : "Data creării fișei"
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-[var(--kf-border)] dark:bg-slate-900 dark:text-slate-200">
            <Megaphone className="size-3.5 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden="true" />
            {notifyChannelLabel(patient.notify_channel)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">{actions}</div>
      </aside>
    </div>
  )
}
