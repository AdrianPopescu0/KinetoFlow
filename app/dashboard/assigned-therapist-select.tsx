"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { assignPatientTherapist } from "@/app/dashboard/patients/actions"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import { toast } from "@/components/ui/toaster"

const UNASSIGNED = ""

export function AssignedTherapistSelect({
  patientId,
  assignedTherapistId,
  therapists,
}: {
  patientId: string
  assignedTherapistId: string | null
  therapists: ClinicTherapistOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const known = therapists.some((therapist) => therapist.id === assignedTherapistId)

  function onChange(value: string) {
    const next = value === UNASSIGNED ? null : value
    startTransition(async () => {
      const result = await assignPatientTherapist(patientId, next)
      if (result.error) {
        toast(result.error)
        return
      }
      toast(next ? "Terapeutul responsabil a fost actualizat." : "Pacientul este neasignat / la comun.")
      router.refresh()
    })
  }

  return (
    <select
      aria-label="Terapeut responsabil"
      disabled={pending}
      value={assignedTherapistId ?? UNASSIGNED}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 max-w-[11.5rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus-visible:border-[#042f2e] disabled:opacity-60"
    >
      <option value={UNASSIGNED}>Neasignat / La comun</option>
      {therapists.map((therapist) => (
        <option key={therapist.id} value={therapist.id}>
          {therapist.name}
        </option>
      ))}
      {assignedTherapistId && !known ? (
        <option value={assignedTherapistId}>Alt terapeut</option>
      ) : null}
    </select>
  )
}
