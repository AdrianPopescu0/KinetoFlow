"use client"

import { memo, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Bell, FolderOpen, Loader2 } from "lucide-react"

import { sendCheckinReminder } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import {
  emptyAssignmentScopeMessage,
  splitPatientsByTodayCheckIn,
  type PatientAssignmentScope,
} from "@/lib/patients/dashboard-filter"
import { vasBadgeClass } from "@/lib/patients/display"
import type { PatientListItem } from "@/lib/patients/types-db"
import { formatBucharestClock } from "@/lib/time/bucharest"
import { cn } from "@/lib/utils"

type CheckinTab = "completed" | "pending"

export function CheckinsTodayPanel({
  patients,
  query,
  scope,
}: {
  patients: PatientListItem[]
  query: string
  scope: PatientAssignmentScope
}) {
  const { completed, pending } = useMemo(() => splitPatientsByTodayCheckIn(patients), [patients])
  const [tab, setTab] = useState<CheckinTab>("completed")
  const visible = tab === "completed" ? completed : pending

  return (
    <div className="px-4 py-4 sm:px-5">
      <div
        className="mb-4 inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto"
        role="tablist"
        aria-label="Status check-in azi"
      >
        <TabButton
          active={tab === "completed"}
          onClick={() => setTab("completed")}
          label="Completat astăzi"
          count={completed.length}
          tone="green"
        />
        <TabButton
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label="În așteptare"
          count={pending.length}
          tone="amber"
        />
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          {query.trim()
            ? "Nu am găsit pacienți pentru căutarea curentă."
            : patients.length === 0
              ? emptyAssignmentScopeMessage(scope)
              : tab === "completed"
                ? "Niciun pacient din această vizualizare nu a trimis încă formularul de azi."
                : "Toți pacienții din această vizualizare au completat check-in-ul de azi."}
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((patient) =>
            tab === "completed" ? (
              <CompletedCheckinRow key={patient.id} patient={patient} />
            ) : (
              <PendingCheckinRow key={patient.id} patient={patient} />
            ),
          )}
        </ul>
      )}
    </div>
  )
}

const TabButton = memo(function TabButton({
  active,
  onClick,
  label,
  count,
  tone,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
  tone: "green" | "amber"
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {label}
      <span
        className={cn(
          "inline-flex min-w-6 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums",
          tone === "green" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900",
        )}
      >
        {count}
      </span>
    </button>
  )
})

const CompletedCheckinRow = memo(function CompletedCheckinRow({ patient }: { patient: PatientListItem }) {
  const time = patient.lastCheckInAt ? formatBucharestClock(patient.lastCheckInAt) : ""

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words font-medium text-slate-800">{patient.full_name}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {time ? `Trimis la ${time}` : "Check-in primit azi"}
          {patient.diagnosis ? ` · ${patient.diagnosis}` : ""}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            vasBadgeClass(patient.lastVas),
          )}
        >
          {patient.lastVas === null ? "Fără scor" : `VAS ${patient.lastVas}`}
        </span>
        <OpenFileLink patientId={patient.id} />
      </div>
    </li>
  )
})

const PendingCheckinRow = memo(function PendingCheckinRow({ patient }: { patient: PatientListItem }) {
  const [isPending, startSend] = useTransition()

  function remind() {
    startSend(async () => {
      const result = await sendCheckinReminder(patient.id)
      if (result.error) {
        toast(result.error)
        return
      }
      toast(`Reminder push trimis către ${patient.full_name}.`)
    })
  }

  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="break-words font-medium text-slate-800">{patient.full_name}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {patient.phone || "Fără telefon"} · fără formular azi
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {patient.lastVas !== null ? (
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              vasBadgeClass(patient.lastVas),
            )}
          >
            VAS {patient.lastVas}
          </span>
        ) : null}
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 ring-inset">
          În așteptare
        </span>
        <Button
          type="button"
          variant="outline"
          onClick={remind}
          disabled={isPending}
          className="h-11 min-h-[44px] rounded-xl border-amber-200 text-amber-950 hover:bg-amber-50"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
          Trimite reminder
        </Button>
        <OpenFileLink patientId={patient.id} />
      </div>
    </li>
  )
})

function OpenFileLink({ patientId }: { patientId: string }) {
  return (
    <Link
      href={`/dashboard/patients/${patientId}`}
      prefetch
      className="inline-flex h-11 min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#042f2e] px-3 text-sm font-medium text-white hover:bg-[#064e3b]"
    >
      <FolderOpen className="size-3.5 shrink-0" />
      Deschide Fișa
    </Link>
  )
}
