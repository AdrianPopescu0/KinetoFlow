"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Trash2 } from "lucide-react"

import { removeTherapistAction } from "@/app/dashboard/echipa/actions"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import { isForbiddenError } from "@/lib/http/forbidden"

export function RemoveTherapistButton({
  userId,
  therapistName,
}: {
  userId: string
  therapistName: string
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    const name = therapistName.trim() || "acest terapeut"
    const confirmed = window.confirm(
      `Ștergi terapeutul „${name}” din echipă? Nu va mai avea acces la cabinet.`,
    )
    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        const result = await removeTherapistAction(userId)
        if (result.error || !result.ok) {
          toast(result.error ?? "Nu am putut șterge terapeutul.")
          return
        }
        toast(`${name} a fost scos din echipă.`)
        router.refresh()
      } catch (caught) {
        if (isForbiddenError(caught)) {
          toast(caught.message)
          return
        }
        toast(caught instanceof Error ? caught.message : "Nu am putut șterge terapeutul.")
      }
    })
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      disabled={isPending}
      onClick={handleClick}
      className="h-10 min-h-[40px] rounded-xl px-3"
      aria-label={`Șterge terapeutul ${therapistName}`}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      Ștergere
    </Button>
  )
}
