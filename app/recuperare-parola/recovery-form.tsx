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
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertCircle />
          <AlertTitle>Cerere invalidă</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {message ? (
        <Alert className="border-primary/20 bg-primary/5">
          <CheckCircle2 className="text-primary" />
          <AlertTitle>Verifică emailul</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={isPending}
          placeholder="nume@clinica.ro"
          className="h-11 px-3"
        />
      </div>

      <Button type="submit" disabled={isPending} className="h-11 w-full font-semibold">
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se trimite…
          </>
        ) : (
          "Trimite linkul de resetare"
        )}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Ți-ai amintit parola?{" "}
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Înapoi la autentificare
        </Link>
      </p>
    </form>
  )
}
