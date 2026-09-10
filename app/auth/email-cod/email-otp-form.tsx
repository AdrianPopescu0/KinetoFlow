"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, Mail } from "lucide-react"

import { register, requestAuthEmailOtpAction } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { enterTherapistApp } from "@/lib/auth/oauth-redirect"
import { loginHref } from "@/lib/auth/paths"
import {
  clearPendingEmailOtp,
  readPendingEmailOtp,
  writePendingEmailOtp,
  type PendingEmailOtp,
} from "@/lib/auth/pending-email-otp"
import { LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"

export function EmailOtpForm({
  email,
}: {
  email: string
  purpose?: "register"
}) {
  const [pending, setPending] = useState<PendingEmailOtp | null>(null)
  const [ready, setReady] = useState(false)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(
    "Deschide emailul pe orice dispozitiv, copiază codul de 6 cifre și tastează-l aici.",
  )
  const [devCode, setDevCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const backHref = loginHref("signup")

  useEffect(() => {
    const stored = readPendingEmailOtp(email)
    setPending(stored?.purpose === "register" ? stored : null)
    setDevCode(stored?.devCode ?? null)
    setReady(true)
  }, [email])

  const canSubmit = useMemo(() => Boolean(pending && otp.length === 6), [otp, pending])

  function handleSubmit(formData: FormData) {
    setError(null)
    if (!pending) {
      setError("Sesiunea de confirmare lipsește pe acest dispozitiv. Revino la înregistrare și cere un cod nou.")
      return
    }

    formData.set("email", pending.email)
    formData.set("password", pending.password)
    formData.set("purpose", "register")
    formData.set("otp", otp.trim())
    if (pending.legalAccept) {
      formData.set(LEGAL_ACCEPT_FIELD, "on")
    }

    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.info) {
        setInfo(result.info)
        return
      }
      clearPendingEmailOtp()
      enterTherapistApp(result?.next)
    })
  }

  function resend() {
    if (!pending) {
      setError("Sesiunea de confirmare lipsește pe acest dispozitiv. Revino la înregistrare și cere un cod nou.")
      return
    }
    if (pending.purpose !== "register") {
      setError("Autentificarea nu mai cere cod. Intră cu email și parolă.")
      return
    }
    setError(null)
    const formData = new FormData()
    formData.set("email", pending.email)
    formData.set("password", pending.password)
    formData.set("purpose", "register")
    if (pending.legalAccept) {
      formData.set(LEGAL_ACCEPT_FIELD, "on")
    }
    startTransition(async () => {
      const requested = await requestAuthEmailOtpAction(formData)
      if (requested?.error) {
        setError(requested.error)
        return
      }
      writePendingEmailOtp({
        ...pending,
        devCode: requested?.devCode,
      })
      setDevCode(requested?.devCode ?? null)
      setInfo(requested?.info ?? "Ți-am trimis un cod nou. Este valabil 10 minute.")
      setOtp("")
    })
  }

  if (!ready) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Se încarcă…
      </div>
    )
  }

  if (!pending) {
    return (
      <div className="flex flex-col gap-5">
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Deschide ecranul pe dispozitivul de pe care ai început</AlertTitle>
          <AlertDescription>
            Codul din email se tastează în KinetoFlow, pe telefonul, tableta sau calculatorul de pe care ai cerut
            confirmarea. Linkurile din mesaj nu te mai autentifică automat — ca să nu blochezi contul dacă deschizi
            mailul pe alt dispozitiv.
          </AlertDescription>
        </Alert>
        <Link href={backHref} className={cn(buttonVariants(), "h-12 min-h-[48px] w-full rounded-xl")}>
          Revino la înregistrare
        </Link>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut confirma adresa</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <Mail />
          <AlertTitle>Introdu codul din email</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="otp-email">Email</Label>
        <Input
          id="otp-email"
          value={email}
          readOnly
          disabled
          className="h-12 border-slate-300 bg-slate-50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="otp">Cod de 6 cifre</Label>
        <Input
          id="otp"
          name="otp"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          autoFocus
          disabled={isPending}
          value={otp}
          onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="h-14 min-h-14 border-slate-300 px-3 text-center font-mono text-2xl tracking-[0.35em]"
        />
        {devCode ? (
          <p className="text-xs text-amber-800">Mediu local, fără Resend: folosește codul {devCode}.</p>
        ) : (
          <p className="text-xs text-slate-500">
            Poți citi emailul pe alt telefon. Codul se introduce aici, pe acest dispozitiv.
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending || !canSubmit}
        className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se verifică…
          </>
        ) : (
          "Confirmă adresa"
        )}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          disabled={isPending}
          className="font-medium text-[#042f2e] underline-offset-4 hover:underline disabled:opacity-50"
          onClick={resend}
        >
          Trimite un cod nou
        </button>
        <Link href={backHref} className="text-slate-600 underline-offset-4 hover:underline">
          Înapoi la înregistrare
        </Link>
      </div>
    </form>
  )
}
