"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Loader2 } from "lucide-react"

import { register } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button, buttonVariants } from "@/components/ui/button"
import { enterTherapistApp, persistTherapistSessionAndEnter } from "@/lib/auth/oauth-redirect"
import { loginHref } from "@/lib/auth/paths"
import { clearPendingEmailOtp, readPendingEmailOtp, type PendingEmailOtp } from "@/lib/auth/pending-email-otp"
import { LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

/** Pagina OTP e păstrată doar ca fallback pentru linkuri vechi — înregistrarea nu mai cere cod. */
export function EmailOtpForm({
  email,
}: {
  email: string
  purpose?: "register"
}) {
  const [pending, setPending] = useState<PendingEmailOtp | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const backHref = loginHref("signup")

  useEffect(() => {
    const stored = readPendingEmailOtp(email)
    setPending(stored?.purpose === "register" ? stored : null)
    setReady(true)
  }, [email])

  function completeRegistration() {
    setError(null)
    if (!pending) {
      setError("Nu mai există date de înregistrare pe acest dispozitiv. Revino la crearea contului.")
      return
    }

    const formData = new FormData()
    formData.set("email", pending.email)
    formData.set("password", pending.password)
    if (pending.legalAccept) {
      formData.set(LEGAL_ACCEPT_FIELD, "on")
    }

    startTransition(async () => {
      const result = await register(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      clearPendingEmailOtp()
      if (result?.accessToken && result.refreshToken) {
        const supabase = createClient()
        const ok = await persistTherapistSessionAndEnter(supabase, result.next, {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        })
        if (ok) {
          return
        }
      }
      enterTherapistApp(result?.next)
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

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut finaliza înregistrarea</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Confirmarea prin cod nu mai este necesară</AlertTitle>
          <AlertDescription>
            Conturile se creează acum direct cu email și parolă. Nu mai trimitem și nu mai cerem cod OTP.
          </AlertDescription>
        </Alert>
      )}

      {pending ? (
        <Button
          type="button"
          disabled={isPending}
          onClick={completeRegistration}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se finalizează contul…
            </>
          ) : (
            "Finalizează contul fără cod"
          )}
        </Button>
      ) : null}

      <Link href={backHref} className={cn(buttonVariants(), "h-12 min-h-[48px] w-full rounded-xl")}>
        Revino la înregistrare
      </Link>
    </div>
  )
}
