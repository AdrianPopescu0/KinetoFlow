"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

import { accessWithCode } from "@/app/acces/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  readRememberedPhone,
  rememberPhone,
  rememberedPhoneServerSnapshot,
  subscribeRememberedPhone,
} from "@/lib/patients/remembered-phone"

export function PatientAccessForm({
  redirectTo,
  prefilledCode = "",
}: {
  redirectTo?: string
  prefilledCode?: string
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const autoSubmitted = useRef(false)

  const rememberedPhone = useSyncExternalStore(
    subscribeRememberedPhone,
    readRememberedPhone,
    rememberedPhoneServerSnapshot,
  )

  const submit = useCallback(
    (formData: FormData) => {
      setError(null)
      rememberPhone(String(formData.get("phone") ?? ""))

      startTransition(async () => {
        const result = await accessWithCode(formData)
        if (result?.error) {
          setError(result.error)
        }
      })
    },
    [startTransition],
  )

  // Link din WhatsApp + telefon reținut pe acest dispozitiv = intrare fără niciun tap.
  useEffect(() => {
    if (autoSubmitted.current || !prefilledCode || !rememberedPhone) {
      return
    }
    autoSubmitted.current = true

    const formData = new FormData()
    formData.set("phone", rememberedPhone)
    formData.set("access_code", prefilledCode)
    if (redirectTo) {
      formData.set("redirectTo", redirectTo)
    }
    submit(formData)
  }, [prefilledCode, rememberedPhone, redirectTo, submit])

  const autoSigningIn = isPending && Boolean(prefilledCode) && Boolean(rememberedPhone) && !error

  return (
    <form action={submit} className="flex flex-col gap-5">
      {redirectTo ? <input type="hidden" name="redirectTo" value={redirectTo} /> : null}
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Acces eșuat</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {autoSigningIn ? (
        <p className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-[#042f2e]">
          <Loader2 className="size-4 animate-spin" />
          Te conectăm automat…
        </p>
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
          defaultValue={rememberedPhone}
          autoFocus={Boolean(prefilledCode) && !rememberedPhone}
          placeholder="07xx xxx xxx"
          className="h-12 border-slate-300"
          autoComplete="tel"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="access_code">Cod de acces (8 cifre)</Label>
        <Input
          id="access_code"
          name="access_code"
          inputMode="numeric"
          pattern="[0-9]{8}"
          maxLength={8}
          required
          disabled={isPending}
          defaultValue={prefilledCode}
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
          "Intră în cont"
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
