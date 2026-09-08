"use client"

import { memo, type MouseEvent, type ReactNode } from "react"
import Link from "next/link"
import { ChevronDown, FolderOpen, Plus } from "lucide-react"

import { AssignedTherapistSelect } from "@/app/dashboard/assigned-therapist-select"
import { VasChart } from "@/app/dashboard/patients/vas-chart"
import { Button } from "@/components/ui/button"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import { vasBadgeClass } from "@/lib/patients/display"
import type { PatientListItem } from "@/lib/patients/types-db"
import { buildVasDailySeries, isHighPainVas } from "@/lib/patients/vas-history"
import { cn } from "@/lib/utils"

type PatientRowHandlers = {
  therapists: ClinicTherapistOption[]
  expanded: boolean
  onToggleExpanded: (patient: PatientListItem) => void
  onAssignTherapist: (patientId: string, previous: string | null, next: string | null) => void
  onOpenExercises: (patientId: string, name: string) => void
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest("a, button, select, input, textarea, label"))
}

function toggleFromRowClick(event: MouseEvent, patient: PatientListItem, onToggle: (patient: PatientListItem) => void) {
  if (isInteractiveTarget(event.target)) {
    return
  }
  onToggle(patient)
}

function PatientVasExpandPanel({ patient }: { patient: PatientListItem }) {
  const days = buildVasDailySeries(patient.checkIns)
  const highPain = isHighPainVas(patient.lastVas)

  return (
    <div
      id={`vas-history-${patient.id}`}
      className={cn(
        "rounded-xl border bg-white p-3 sm:p-4",
        highPain ? "border-red-200" : "border-slate-200",
      )}
    >
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-800">Evoluție VAS</p>
          <p className="text-xs text-slate-600">
            {days.length === 0
              ? "Nu există check-in-uri înregistrate."
              : days.length === 1
                ? "1 zi cu check-in · punctul arată ultima notă din zi (calendar București)."
                : `${days.length} zile cu check-in · fiecare punct e ultima notă VAS din ziua respectivă.`}
          </p>
        </div>
        {highPain ? (
          <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-800 ring-1 ring-red-200 ring-inset">
            Alertă durere
          </span>
        ) : null}
      </div>
      <VasChart checkIns={patient.checkIns} compact />
    </div>
  )
}

function ExpandNameButton({
  patient,
  expanded,
  onToggle,
  subtitle,
}: {
  patient: PatientListItem
  expanded: boolean
  onToggle: (patient: PatientListItem) => void
  subtitle: ReactNode
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={expanded ? `vas-history-${patient.id}` : undefined}
      aria-label={
        expanded
          ? `Ascunde evoluția VAS pentru ${patient.full_name}`
          : `Afișează evoluția VAS pentru ${patient.full_name}`
      }
      onClick={() => onToggle(patient)}
      className="flex min-w-0 items-start gap-2 text-left"
    >
      <ChevronDown
        className={cn(
          "mt-0.5 size-4 shrink-0 text-slate-400 transition-transform",
          expanded && "rotate-180 text-[#042f2e]",
        )}
      />
      <span className="min-w-0">
        <span className="block break-words font-medium text-slate-800">{patient.full_name}</span>
        {subtitle}
      </span>
    </button>
  )
}

export const PatientMobileCard = memo(function PatientMobileCard({
  patient,
  therapists,
  expanded,
  onToggleExpanded,
  onAssignTherapist,
  onOpenExercises,
}: {
  patient: PatientListItem
} & PatientRowHandlers) {
  return (
    <li
      className={cn(
        "flex min-w-0 flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm",
        expanded && isHighPainVas(patient.lastVas) ? "border-red-200" : "border-slate-200",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <ExpandNameButton
          patient={patient}
          expanded={expanded}
          onToggle={onToggleExpanded}
          subtitle={<span className="mt-0.5 block break-words text-xs text-slate-500">{patient.phone || "Fără telefon"}</span>}
        />
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={expanded ? `vas-history-${patient.id}` : undefined}
          onClick={() => onToggleExpanded(patient)}
          className={cn(
            "inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            vasBadgeClass(patient.lastVas),
          )}
        >
          {patient.lastVas === null ? "Fără scor" : `VAS ${patient.lastVas}`}
        </button>
      </div>

      {expanded ? <PatientVasExpandPanel patient={patient} /> : null}

      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs font-medium text-slate-500">Terapeut responsabil</span>
        <AssignedTherapistSelect
          fullWidth
          patientId={patient.id}
          assignedTherapistId={patient.assigned_therapist_id}
          therapists={therapists}
          onAssign={onAssignTherapist}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenExercises(patient.id, patient.full_name)}
          className="h-11 min-h-[44px] w-full min-w-0 rounded-xl"
        >
          <Plus className="size-3.5 shrink-0" />
          Exerciții
        </Button>
        <Link
          href={`/dashboard/patients/${patient.id}`}
          prefetch
          className="inline-flex h-11 min-h-[44px] w-full min-w-0 items-center justify-center gap-1.5 rounded-xl bg-[#042f2e] px-3 text-sm font-medium text-white"
        >
          <FolderOpen className="size-3.5 shrink-0" />
          Deschide Fișa
        </Link>
      </div>
    </li>
  )
})

export const PatientTableRow = memo(function PatientTableRow({
  patient,
  therapists,
  expanded,
  onToggleExpanded,
  onAssignTherapist,
  onOpenExercises,
}: {
  patient: PatientListItem
} & PatientRowHandlers) {
  return (
    <>
      <tr
        className={cn(
          "cursor-pointer border-b border-slate-100 hover:bg-slate-50/80",
          expanded && "bg-slate-50",
        )}
        onClick={(event) => toggleFromRowClick(event, patient, onToggleExpanded)}
      >
        <td className="px-5 py-4">
          <ExpandNameButton
            patient={patient}
            expanded={expanded}
            onToggle={onToggleExpanded}
            subtitle={
              <span className="mt-0.5 block text-xs text-slate-500">{patient.email || patient.phone || "—"}</span>
            }
          />
        </td>
        <td className="px-5 py-4 text-slate-700">{patient.diagnosis || "—"}</td>
        <td className="px-5 py-4">
          <span
            className={cn(
              "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              vasBadgeClass(patient.lastVas),
            )}
          >
            {patient.lastVas === null ? "Fără scor" : `VAS ${patient.lastVas}`}
          </span>
        </td>
        <td className="px-5 py-4">
          <AssignedTherapistSelect
            patientId={patient.id}
            assignedTherapistId={patient.assigned_therapist_id}
            therapists={therapists}
            onAssign={onAssignTherapist}
          />
        </td>
        <td className="px-5 py-4">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenExercises(patient.id, patient.full_name)}
              className="h-11 min-h-[44px] rounded-xl"
            >
              <Plus className="size-4" />
              Exerciții
            </Button>
            <Link
              href={`/dashboard/patients/${patient.id}`}
              prefetch
              className="inline-flex h-11 min-h-[44px] items-center gap-1.5 rounded-xl bg-[#042f2e] px-3 text-sm font-medium text-white hover:bg-[#064e3b]"
            >
              <FolderOpen className="size-4" />
              Deschide Fișa
            </Link>
          </div>
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-slate-100 bg-slate-50">
          <td colSpan={5} className="px-5 py-4">
            <PatientVasExpandPanel patient={patient} />
          </td>
        </tr>
      ) : null}
    </>
  )
})
