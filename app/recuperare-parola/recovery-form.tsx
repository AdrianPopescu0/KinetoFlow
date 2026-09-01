"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

import { requestPasswordReset } from "@/app/recuperare-parola/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RecoveryForm() {
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    setMessage(null)

    startTransition(async () => {
      const result = await requestPasswordReset(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setMessage(result.message)
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Cerere invalidă</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-slate-800">
          <CheckCircle2 className="text-emerald-600" />
          <AlertTitle>Verifică emailul</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email" className="text-slate-900">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="nume@clinica.ro"
          className="h-12 min-h-12 border-slate-300 px-3"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="h-12 min-h-[48px] w-full rounded-xl font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se trimite…
          </>
        ) : (
          "Trimite linkul de resetare"
        )}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Ți-ai amintit parola?{" "}
        <Link
          href="/login"
          className="font-medium text-[#042f2e] underline-offset-4 hover:underline"
        >
          Înapoi la autentificare
        </Link>
      </p>
    </form>
  )
}
