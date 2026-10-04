"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertCircle, Loader2, Mail } from "lucide-react"

import { login, register, requestAuthEmailOtpAction } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  clearTherapistAppEnterGuard,
  enterTherapistApp,
  therapistEnterPath,
} from "@/lib/auth/oauth-redirect"
import { loginHref } from "@/lib/auth/paths"
import {
  clearPendingEmailOtp,
  readPendingEmailOtp,
  writePendingEmailOtp,
  type PendingEmailOtp,
} from "@/lib/auth/pending-email-otp"
import { LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

export function EmailOtpForm({
  email,
  purpose = "register",
}: {
  email: string
  purpose?: "login" | "register"
}) {
  const [pending, setPending] = useState<PendingEmailOtp | null>(null)
  const [ready, setReady] = useState(false)
  const [otp, setOtp] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(
    "Deschide emailul, copiază codul de 6 cifre și tastează-l aici pe același dispozitiv.",
  )
  const [devCode, setDevCode] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const backHref = loginHref(purpose === "register" ? "signup" : "signin")

  useEffect(() => {
    const stored = readPendingEmailOtp(email)
    setPending(stored?.purpose === purpose ? stored : null)
    setDevCode(stored?.devCode ?? null)
    setReady(true)
  }, [email, purpose])

  const canSubmit = useMemo(
    () => Boolean(pending && otp.length === 6 && !isSubmitting && !isRedirecting),
    [otp, pending, isSubmitting, isRedirecting],
  )

  async function finishAuth(result: Awaited<ReturnType<typeof login>>) {
    if (result?.error) {
      setError(result.error)
      return
    }
    if (result?.info) {
      setInfo(result.info)
      return
    }

    setIsRedirecting(true)
    clearPendingEmailOtp()
    clearTherapistAppEnterGuard()

    const next = therapistEnterPath(result?.next)

    try {
      if (result?.accessToken && result.refreshToken) {
        const supabase = createClient()
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        })
        if (sessionError) {
          console.error("OTP setSession:", sessionError.message)
        }
        // Așteptăm persistarea în storage înainte de hard navigation.
        await supabase.auth.getSession()
      }

      // Navigare de document în afara startTransition — evită ecranul
      // „This page couldn't load” când React încă ține tranziția deschisă.
      window.location.assign(next)
    } catch (error) {
      console.error("OTP redirect failed:", error)
      try {
        enterTherapistApp(next)
      } catch {
        setIsRedirecting(false)
        setError(
          "Codul e valid și sesiunea e creată, dar redirecționarea a eșuat. Apasă Reload sau deschide dashboard-ul.",
        )
      }
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null)
    if (!pending || isSubmitting || isRedirecting) {
      if (!pending) {
        setError("Sesiunea de confirmare lipsește pe acest dispozitiv. Revino și cere un cod nou.")
      }
      return
    }

    formData.set("email", pending.email)
    formData.set("password", pending.password)
    formData.set("purpose", pending.purpose)
    formData.set("otp", otp.trim())
    if (pending.legalAccept) {
      formData.set(LEGAL_ACCEPT_FIELD, "on")
    }

    setIsSubmitting(true)
    try {
      const result =
        pending.purpose === "login" ? await login(formData) : await register(formData)
      await finishAuth(result)
    } catch (error) {
      console.error("OTP verify failed:", error)
      setError("Nu am putut valida codul. Încearcă din nou.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resend() {
    if (!pending || isSubmitting || isRedirecting) {
      if (!pending) {
        setError("Sesiunea de confirmare lipsește pe acest dispozitiv. Revino și cere un cod nou.")
      }
      return
    }
    setError(null)
    const formData = new FormData()
    formData.set("email", pending.email)
    formData.set("password", pending.password)
    formData.set("purpose", pending.purpose)
    if (pending.legalAccept) {
      formData.set(LEGAL_ACCEPT_FIELD, "on")
    }
    setIsSubmitting(true)
    try {
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
    } catch (error) {
      console.error("OTP resend failed:", error)
      setError("Nu am putut retrimite codul. Încearcă din nou.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!ready) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" />
        Se încarcă…
      </div>
    )
  }

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 shadow-sm">
        <Loader2 className="size-5 animate-spin text-teal-700" aria-hidden="true" />
        <p className="font-medium text-slate-800">Cod valid. Te ducem în clinică…</p>
        <p className="text-xs text-slate-500">Nu închide această fereastră.</p>
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
            Codul din email se tastează în KinetoFlow, pe telefonul, tableta sau calculatorul de pe
            care ai cerut confirmarea.
          </AlertDescription>
        </Alert>
        <Link href={backHref} className={cn(buttonVariants(), "h-12 min-h-[48px] w-full rounded-xl")}>
          {purpose === "register" ? "Revino la înregistrare" : "Revino la autentificare"}
        </Link>
      </div>
    )
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut confirma codul</AlertTitle>
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
          disabled={isSubmitting || isRedirecting}
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
        disabled={!canSubmit}
        className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se verifică…
          </>
        ) : purpose === "register" ? (
          "Confirmă și creează contul"
        ) : (
          "Confirmă și intră în cont"
        )}
      </Button>

      <div className="flex flex-col items-center gap-2 text-sm">
        <button
          type="button"
          disabled={isSubmitting || isRedirecting}
          className="font-medium text-[#042f2e] underline-offset-4 hover:underline disabled:opacity-50"
          onClick={() => {
            void resend()
          }}
        >
          Trimite un cod nou
        </button>
        <Link href={backHref} className="text-slate-600 underline-offset-4 hover:underline">
          {purpose === "register" ? "Înapoi la înregistrare" : "Înapoi la autentificare"}
        </Link>
      </div>
    </form>
  )
}
