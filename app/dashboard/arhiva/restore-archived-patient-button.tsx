"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"

import { unarchivePatient } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"

export function RestoreArchivedPatientButton({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function restore() {
    startTransition(async () => {
      const result = await unarchivePatient(patientId)
      if (result.error) {
        toast(result.error)
        return
      }
      toast(`${patientName} a fost restaurat în lista activă.`)
      router.refresh()
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={restore}
      disabled={isPending}
      className="h-11 min-h-[44px] rounded-xl"
    >
      {isPending ? "Se restaurează…" : "Restaurează"}
    </Button>
  )
}
