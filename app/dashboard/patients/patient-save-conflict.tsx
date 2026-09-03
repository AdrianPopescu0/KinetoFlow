"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export function PatientSaveConflictNotice({
  onReload,
  onOverwrite,
  pending,
}: {
  onReload: () => void
  onOverwrite: () => void
  pending?: boolean
}) {
  return (
    <Alert className="border-amber-200 bg-amber-50 text-amber-950">
      <AlertTitle>Fișa a fost modificată între timp</AlertTitle>
      <AlertDescription className="text-amber-900">
        Altcineva a salvat această fișă după ce ai deschis ecranul. Reîncarcă datele noi ca să nu pierzi
        modificările lor, sau salvează oricum dacă vrei să suprascrii.
      </AlertDescription>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          className="h-10 rounded-xl border-amber-300 bg-white"
          onClick={onReload}
          disabled={pending}
        >
          Reîncarcă datele noi
        </Button>
        <Button type="button" className="h-10 rounded-xl" onClick={onOverwrite} disabled={pending}>
          Salvează oricum
        </Button>
      </div>
    </Alert>
  )
}
