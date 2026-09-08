"use client"

import { memo } from "react"
import Link from "next/link"
import { FolderOpen, Plus } from "lucide-react"

import { AssignedTherapistSelect } from "@/app/dashboard/assigned-therapist-select"
import { Button } from "@/components/ui/button"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import { vasBadgeClass } from "@/lib/patients/display"
import type { PatientListItem } from "@/lib/patients/types-db"
import { cn } from "@/lib/utils"

type PatientRowHandlers = {
  therapists: ClinicTherapistOption[]
  onAssignTherapist: (patientId: string, previous: string | null, next: string | null) => void
  onOpenExercises: (patientId: string, name: string) => void
}

export const PatientMobileCard = memo(function PatientMobileCard({
  patient,
  therapists,
  onAssignTherapist,
  onOpenExercises,
}: {
  patient: PatientListItem
} & PatientRowHandlers) {
  return (
    <li className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="min-w-0">
        <p className="break-words font-medium text-slate-800">{patient.full_name}</p>
        <p className="mt-0.5 break-words text-xs text-slate-500">{patient.phone || "Fără telefon"}</p>
      </div>

      <span
        className={cn(
          "inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
          vasBadgeClass(patient.lastVas),
        )}
      >
        {patient.lastVas === null ? "Fără scor" : `VAS ${patient.lastVas}`}
      </span>

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
  onAssignTherapist,
  onOpenExercises,
}: {
  patient: PatientListItem
} & PatientRowHandlers) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="px-5 py-4">
        <p className="font-medium text-slate-800">{patient.full_name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{patient.email || patient.phone || "—"}</p>
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
  )
})
