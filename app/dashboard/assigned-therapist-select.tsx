"use client"

import type { ClinicTherapistOption } from "@/lib/clinics/types"
import { cn } from "@/lib/utils"

const UNASSIGNED = ""

export function AssignedTherapistSelect({
  assignedTherapistId,
  therapists,
  onSelect,
  className,
  fullWidth = false,
}: {
  assignedTherapistId: string | null
  therapists: ClinicTherapistOption[]
  onSelect: (assignedTherapistId: string | null) => void
  className?: string
  fullWidth?: boolean
}) {
  const value = assignedTherapistId ?? UNASSIGNED
  const isAssigned = value !== UNASSIGNED
  const known = isAssigned && therapists.some((therapist) => therapist.user_id === value)

  return (
    <select
      aria-label="Terapeut responsabil"
      value={value}
      onChange={(event) => onSelect(event.target.value === UNASSIGNED ? null : event.target.value)}
      className={cn(
        "min-w-0 rounded-lg border border-slate-200 bg-white font-medium text-slate-700 outline-none focus-visible:border-[#042f2e]",
        fullWidth
          ? "block h-11 min-h-[44px] w-full max-w-full px-3 text-sm"
          : "h-9 max-w-[11.5rem] px-2 text-xs",
        className,
      )}
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
