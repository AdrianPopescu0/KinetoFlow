"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

import { assignPatientTherapist } from "@/app/dashboard/patients/actions"
import { toast } from "@/components/ui/toaster"

const UNASSIGNED = ""

export function AssignedTherapistSelect({
  patientId,
  assignedTherapistId,
  therapists,
}: {
  patientId: string
  assignedTherapistId: string | null
  therapists: Array<{ user_id: string; therapist_name: string }>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState(assignedTherapistId ?? UNASSIGNED)

  useEffect(() => {
    setSelected(assignedTherapistId ?? UNASSIGNED)
  }, [assignedTherapistId])

  const isAssigned = selected !== UNASSIGNED
  const known = isAssigned && therapists.some((therapist) => therapist.user_id === selected)

  function onChange(value: string) {
    const targetUserId = value === UNASSIGNED ? null : value
    const previous = selected
    setSelected(value)

    startTransition(async () => {
      const result = await assignPatientTherapist(patientId, targetUserId)
      if (result.error) {
        setSelected(previous)
        toast(result.error)
        return
      }
      const name = therapists.find((therapist) => therapist.user_id === targetUserId)?.therapist_name
      toast(name ? `Pacientul a fost asignat lui ${name}.` : "Pacientul este neasignat / la comun.")
      router.refresh()
    })
  }

  return (
    <select
      aria-label="Terapeut responsabil"
      disabled={pending}
      value={selected}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 max-w-[11.5rem] rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none focus-visible:border-[#042f2e] disabled:opacity-60"
    >
      <option value={UNASSIGNED}>Neasignat / La comun</option>
      {therapists.map((therapist) => (
        <option key={therapist.user_id} value={therapist.user_id}>
          {therapist.therapist_name}
        </option>
      ))}
      {isAssigned && !known ? <option value={selected}>Terapeut din alt cabinet</option> : null}
    </select>
  )
}
