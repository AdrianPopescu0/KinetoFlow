"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Check, Circle, Eye, EyeOff, Loader2, Mail } from "lucide-react"

import {
  finishEarlyAccessLogin,
  finishEarlyAccessRegister,
  requestEarlyAccessEmailOtp,
} from "@/app/early-access/actions"
import { prepareTherapistInviteOAuth } from "@/app/auth/invitatie/actions"
import { GoogleMark } from "@/components/auth/google-mark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { enterTherapistApp, oauthBrowserRedirectToWithPendingInvite } from "@/lib/auth/oauth-redirect"
import { persistTherapistInviteToken, readStoredTherapistInviteToken } from "@/lib/clinics/invite-session"
import { evaluateRegisterPassword } from "@/lib/auth/password"
import { LEGAL_ACCEPT_ERROR, LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

type AccountMode = "login" | "register"

export function EarlyAccessWelcomeForm({
  initialEmail = "",
  initialVerified = false,
  initialError = null,
  initialInfo = null,
}: {
  initialEmail?: string
  initialVerified?: boolean
  initialError?: string | null
  initialInfo?: string | null
}) {
  const [email, setEmail] = useState(initialEmail)
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [otpSent, setOtpSent] = useState(initialVerified)
  const [mode, setMode] = useState<AccountMode>("register")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [info, setInfo] = useState<string | null>(initialInfo)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [googlePending, setGooglePending] = useState(false)
  const passwordChecks = evaluateRegisterPassword(password)
  const busy = isPending || googlePending
  const canSubmitRegister = passwordChecks.isValid && acceptedTerms

  function handleSubmit(formData: FormData) {
    setError(null)
    setInfo(null)
    formData.set("email", email)

    startTransition(async () => {
      if (mode === "login") {
        const result = await finishEarlyAccessLogin(formData)
        if (result?.error) {
          setError(result.error)
          return
        }
        if (result?.info) {
          setInfo(result.info)
          return
        }
        enterTherapistApp(result?.next)
        return
      }

      if (!canSubmitRegister) {
        setError(
          acceptedTerms
            ? "Parola trebuie să aibă minim 8 caractere, o majusculă, o cifră și un caracter special."
            : LEGAL_ACCEPT_ERROR,
        )
        return
      }

      if (!otpSent) {
        formData.set("purpose", "register")
        const requested = await requestEarlyAccessEmailOtp(formData)
        if (requested?.error) {
          setError(requested.error)
          return
        }
        setOtpSent(true)
        setInfo(requested?.info ?? "Ți-am trimis un cod de 6 cifre pe email.")
        setDevCode(requested?.devCode ?? null)
        return
      }

      formData.set("otp", otp.trim())
      formData.set("purpose", "register")
      const result = await finishEarlyAccessRegister(formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      if (result?.info) {
        setInfo(result.info)
        return
      }
      enterTherapistApp(result?.next)
    })
  }

  async function handleGoogleLogin() {
    if (mode === "register" && !acceptedTerms) {
      setError(LEGAL_ACCEPT_ERROR)
      return
    }
    setError(null)
    setInfo(null)
    setGooglePending(true)
    const pendingInvite = readStoredTherapistInviteToken()
    if (pendingInvite) {
      persistTherapistInviteToken(pendingInvite)
      const prepared = await prepareTherapistInviteOAuth(pendingInvite)
      if (prepared?.error) {
        setError(prepared.error)
        setGooglePending(false)
        return
      }
    }
    try {
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
      } catch {
        // Continuăm cu Google; callback-ul creează sesiunea nouă.
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthBrowserRedirectToWithPendingInvite(window.location.origin, "/dashboard"),
        },
      })
      if (oauthError) {
        setError("Nu am putut porni autentificarea cu Google. Încearcă din nou.")
        setGooglePending(false)
      }
    } catch {
      setError("Nu am putut porni autentificarea cu Google. Încearcă din nou.")
      setGooglePending(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut continua</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <Mail />
          <AlertTitle>
            {mode === "register" && otpSent ? "Verifică emailul" : "Continuă cu emailul"}
          </AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div
          role="tablist"
          aria-label="Tip de cont"
          className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1"
        >
          <ModeButton
            active={mode === "register"}
            onClick={() => {
              setMode("register")
              setError(null)
              setInfo(null)
            }}
          >
            Creează cont
          </ModeButton>
          <ModeButton
            active={mode === "login"}
            onClick={() => {
              setMode("login")
              setOtpSent(false)
              setOtp("")
              setDevCode(null)
              setError(null)
              setInfo(null)
            }}
          >
            Am deja cont
          </ModeButton>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="early-access-email" className="text-slate-900">
            Adresa de email personală
          </Label>
          <Input
            id="early-access-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            autoFocus={!initialEmail}
            disabled={busy || (mode === "register" && otpSent)}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="emailul-tau@exemplu.com"
            className="h-12 min-h-12 border-slate-300 px-3"
          />
          <p className="text-xs leading-relaxed text-slate-500">
            {mode === "register"
              ? "Îți trimitem un cod de 6 cifre doar la crearea contului, ca să confirmăm adresa."
              : "Contul confirmat se deschide doar cu email și parolă, fără un nou cod."}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="early-access-password" className="text-slate-900">
              {mode === "register" ? "Alege o parolă" : "Parola contului"}
            </Label>
            {mode === "login" ? (
              <Link
                href="/recuperare-parola"
                className="text-sm font-medium text-[#042f2e] underline-offset-4 hover:underline"
              >
                Ai uitat parola?
              </Link>
            ) : null}
          </div>
          <div className="relative">
            <Input
              id="early-access-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy || (mode === "register" && otpSent)}
              placeholder={mode === "register" ? "Alege o parolă puternică" : "••••••••"}
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={busy}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 transition-colors hover:text-slate-900 disabled:opacity-50"
              aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {mode === "register" ? (
            <ul className="mt-1 grid gap-1.5">
              {passwordChecks.checks.map((check) => (
                <li
                  key={check.id}
                  className={cn(
                    "flex items-center gap-2 text-xs",
                    check.met ? "text-emerald-700" : "text-slate-400",
                  )}
                >
                  {check.met ? (
                    <Check className="size-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Circle className="size-3.5 shrink-0 text-slate-300" aria-hidden="true" />
                  )}
                  {check.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {mode === "register" ? (
          <label
            htmlFor={LEGAL_ACCEPT_FIELD}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm leading-relaxed text-slate-700"
          >
            <input
              id={LEGAL_ACCEPT_FIELD}
              name={LEGAL_ACCEPT_FIELD}
              type="checkbox"
              required
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              disabled={busy || otpSent}
              className="mt-1 size-4 shrink-0 rounded border-slate-300 accent-[#042f2e]"
            />
            <span>
              Sunt de acord cu{" "}
              <Link
                href="/termeni"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#042f2e] underline underline-offset-4"
                onClick={(event) => event.stopPropagation()}
              >
                Termenii și Condițiile
              </Link>{" "}
              și{" "}
              <Link
                href="/confidentialitate"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[#042f2e] underline underline-offset-4"
                onClick={(event) => event.stopPropagation()}
              >
                Politica de Confidențialitate
              </Link>
              .
            </span>
          </label>
        ) : null}

        {mode === "register" && otpSent ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="early-access-otp" className="text-slate-900">
              Cod de confirmare din email
            </Label>
            <Input
              id="early-access-otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required
              autoFocus
              disabled={busy}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="h-12 min-h-12 border-slate-300 px-3 font-mono tracking-[0.28em]"
            />
            {devCode ? (
              <p className="text-xs text-amber-800">Mediu local, fără Resend: folosește codul {devCode}.</p>
            ) : (
              <p className="text-xs text-slate-500">
                6 cifre, valabile 10 minute. Tastează-le aici, chiar dacă ai deschis emailul pe alt dispozitiv.
              </p>
            )}
            <button
              type="button"
              disabled={busy}
              className="self-start text-sm font-medium text-[#042f2e] underline-offset-4 hover:underline disabled:opacity-50"
              onClick={() => {
                setOtpSent(false)
                setOtp("")
                setInfo(null)
                setDevCode(null)
              }}
            >
              Schimbă emailul sau trimite un cod nou
            </button>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={busy || (mode === "register" && !canSubmitRegister)}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se procesează…
            </>
          ) : mode === "login" ? (
            "Intră în cont"
          ) : otpSent ? (
            "Confirmă adresa"
          ) : (
            "Creează contul"
          )}
        </Button>
      </form>

      <div className="flex items-center gap-3" role="separator" aria-label="sau">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">sau</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        aria-label="Sign in with Google"
        onClick={() => {
          void handleGoogleLogin()
        }}
        className="h-12 min-h-[48px] w-full rounded-xl border-slate-300 bg-white text-sm font-semibold text-slate-800"
      >
        {googlePending ? <Loader2 className="size-4 animate-spin" /> : <GoogleMark className="size-5" />}
        Continuă cu Google (opțional)
      </Button>
    </div>
  )
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-auto min-h-11 rounded-lg px-2 py-2 text-sm font-medium leading-tight whitespace-normal transition-colors",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  )
}
