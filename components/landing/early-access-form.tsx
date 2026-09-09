"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"

import { unlockEarlyAccess } from "@/app/early-access/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EARLY_ACCESS_CODE_LENGTH } from "@/lib/auth/early-access-constants"

export function EarlyAccessForm({
  autoFocus = true,
  submitLabel = "Continuă către autentificare",
}: {
  autoFocus?: boolean
  submitLabel?: string
}) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await unlockEarlyAccess(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="early-access-code">Cod de acces (12 caractere)</Label>
        <Input
          id="early-access-code"
          name="code"
          required
          autoFocus={autoFocus}
          autoComplete="one-time-code"
          spellCheck={false}
          maxLength={EARLY_ACCESS_CODE_LENGTH}
          minLength={EARLY_ACCESS_CODE_LENGTH}
          value={code}
          onChange={(event) => setCode(event.target.value.slice(0, EARLY_ACCESS_CODE_LENGTH))}
          disabled={isPending}
          placeholder="••••••••••••"
          className="h-12 border-slate-300 font-mono tracking-[0.18em]"
        />
        <p className="text-xs text-slate-500">
          Codul este alocat de echipa KinetoFlow. Fără el, înregistrarea și autentificarea
          terapeuților rămân blocate.
        </p>
      </div>
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        disabled={isPending || code.length !== EARLY_ACCESS_CODE_LENGTH}
        className="h-11 rounded-xl"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se verifică…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  )
}
