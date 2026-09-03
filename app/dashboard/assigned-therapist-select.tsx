"use client"

import type { ClinicTherapistOption } from "@/lib/clinics/types"

const UNASSIGNED = ""

export function AssignedTherapistSelect({
  assignedTherapistId,
  therapists,
  onSelect,
}: {
  assignedTherapistId: string | null
  therapists: ClinicTherapistOption[]
  onSelect: (assignedTherapistId: string | null) => void
}) {
  const value = assignedTherapistId ?? UNASSIGNED
  const isAssigned = value !== UNASSIGNED
  const known = isAssigned && therapists.some((therapist) => therapist.user_id === value)

  return (
    <select
      aria-label="Terapeut responsabil"
      value={value}
      onChange={(event) => onSelect(event.target.value === UNASSIGNED ? null : event.target.value)}
      className="h-9 max-w-[11.5rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus-visible:border-[#042f2e]"
    >
      <option value={UNASSIGNED}>Neasignat / La comun</option>
      {therapists.map((therapist) => (
        <option key={therapist.user_id} value={therapist.user_id}>
          {therapist.therapist_name}
        </option>
      ))}
      {isAssigned && !known ? <option value={value}>Terapeut din alt cabinet</option> : null}
    </select>
  )
}
