"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2 } from "lucide-react"

import { saveClinicProfile } from "@/app/onboarding/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function OnboardingForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await saveClinicProfile(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.ok) {
        router.push("/dashboard")
        router.refresh()
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut salva clinica</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="clinic_name">Numele clinicii / cabinetului</Label>
        <Input
          id="clinic_name"
          name="clinic_name"
          required
          disabled={isPending}
          placeholder="KinetoCare"
          className="h-12 border-slate-300"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="therapist_full_name">Numele și prenumele terapeutului</Label>
        <Input
          id="therapist_full_name"
          name="therapist_full_name"
          required
          disabled={isPending}
          placeholder="Adrian Popescu"
          autoComplete="name"
          className="h-12 border-slate-300"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="contact_phone">Număr de telefon / WhatsApp al clinicii</Label>
        <Input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          required
          disabled={isPending}
          placeholder="07xx xxx xxx"
          autoComplete="tel"
          className="h-12 border-slate-300"
        />
        <p className="text-xs text-slate-500">
          Pacienții îl vor folosi ca număr de contact. Salvăm formatul internațional (40…).
        </p>
      </div>

      <Button type="submit" disabled={isPending} className="h-12 min-h-[48px] w-full rounded-xl">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se salvează…
          </>
        ) : (
          "Salvează și deschide dashboard-ul"
        )}
      </Button>
    </form>
  )
}
