"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

import { accessWithCode } from "@/app/acces/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function PatientAccessForm() {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await accessWithCode(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Acces eșuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Număr de telefon</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          required
          disabled={isPending}
          placeholder="07xx xxx xxx"
          className="h-12 border-slate-300"
          autoComplete="tel"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="access_code">Codul tău de 8 cifre</Label>
        <Input
          id="access_code"
          name="access_code"
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          required
          disabled={isPending}
          placeholder="12345678"
          className="h-12 border-slate-300 tracking-[0.3em]"
          autoComplete="one-time-code"
        />
      </div>

      <Button type="submit" disabled={isPending} className="h-12 w-full rounded-xl">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se verifică…
          </>
        ) : (
          "Intră în program"
        )}
      </Button>

      <p className="text-center text-sm text-slate-500">
        Ești terapeut?{" "}
        <Link href="/login" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
          Autentificare clinică
        </Link>
      </p>
    </form>
  )
}
