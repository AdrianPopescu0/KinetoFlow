"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Check, Circle, Eye, EyeOff, Loader2, Mail } from "lucide-react"

import { login, register, requestAuthEmailOtpAction } from "@/app/login/actions"
import { GoogleMark } from "@/components/auth/google-mark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { enterTherapistApp, oauthBrowserRedirectTo } from "@/lib/auth/oauth-redirect"
import { loginHref } from "@/lib/auth/paths"
import { evaluateRegisterPassword } from "@/lib/auth/password"
import { LEGAL_ACCEPT_ERROR, LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

type AuthTab = "login" | "register"

export function LoginForm({
  initialTab,
  initialError = null,
  initialInfo = null,
  initialOtpVerified = false,
}: {
  initialTab: AuthTab
  initialError?: string | null
  initialInfo?: string | null
  initialOtpVerified?: boolean
}) {
  const tab = initialTab
  const [error, setError] = useState<string | null>(initialError)
  const [info, setInfo] = useState<string | null>(initialInfo)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(initialOtpVerified)
  const [devCode, setDevCode] = useState<string | null>(null)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [googlePending, setGooglePending] = useState(false)
  const passwordChecks = evaluateRegisterPassword(password)
  const canSubmitRegister = passwordChecks.isValid && acceptedTerms
  const busy = isPending || googlePending

  const handleGoogleAuth = async () => {
    if (tab === "register" && !acceptedTerms) {
      setError(LEGAL_ACCEPT_ERROR)
      return
    }

    setError(null)
    setInfo(null)
    setGooglePending(true)

    try {
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
      } catch {
        // Continuăm cu Google; callback-ul creează sesiunea nouă.
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthBrowserRedirectTo(window.location.origin, {
            next: tab === "register" ? "/onboarding" : "/dashboard",
          }),
        },
      })
      if (error) {
        console.error("Eroare la logarea cu Google:", error.message)
        setError("Nu am putut porni autentificarea cu Google. Încearcă din nou.")
        setGooglePending(false)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      console.error("Eroare la logarea cu Google:", message)
      setError("Nu am putut porni autentificarea cu Google. Încearcă din nou.")
      setGooglePending(false)
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setInfo(null)

    startTransition(async () => {
      if (tab === "register") {
        if (!evaluateRegisterPassword(String(formData.get("password") ?? "")).isValid) {
          setError("Parola trebuie să aibă minim 8 caractere, o majusculă, o cifră și un caracter special.")
          return
        }
        if (formData.get(LEGAL_ACCEPT_FIELD) !== "on") {
          setError(LEGAL_ACCEPT_ERROR)
          return
        }
      }

      if (!otpSent) {
        formData.set("purpose", tab)
        const requested = await requestAuthEmailOtpAction(formData)
        if (requested?.error) {
          setError(requested.error)
          return
        }
        setOtpSent(true)
        setInfo(requested?.info ?? "Ți-am trimis un cod de acces pe email.")
        setDevCode(requested?.devCode ?? null)
        return
      }

      if (otp.trim()) {
        formData.set("otp", otp.trim())
      }
      const result = tab === "register" ? await register(formData) : await login(formData)
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

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Autentificare sau înregistrare"
        className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        <AuthModeTab href={loginHref("signin")} active={tab === "login"}>
          Intră în cont
        </AuthModeTab>
        <AuthModeTab href={loginHref("signup")} active={tab === "register"}>
          Înregistrează clinică nouă
        </AuthModeTab>
      </div>

      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>{tab === "register" ? "Nu am putut crea contul" : "Autentificare eșuată"}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <Mail />
          <AlertTitle>{otpSent ? "Verifică emailul" : "Confirmă adresa de email"}</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        aria-label={tab === "register" ? "Creează cont cu Google" : "Intră cu Google"}
        onClick={() => {
          void handleGoogleAuth()
        }}
        className="h-12 min-h-[48px] w-full rounded-xl border-slate-300 bg-white text-sm font-semibold text-slate-800"
      >
        {googlePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark className="size-5" />
        )}
        {tab === "register" ? "Creează cont cu Google" : "Intră cu Google"}
      </Button>

      <div className="flex items-center gap-3" role="separator" aria-label="sau">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">sau</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-slate-900">
            {tab === "register" ? "Email administrator" : "Adresa de email"}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={busy}
            placeholder={
              tab === "register"
                ? "exemplu@gmail.com sau email@clinica.ro"
                : "emailul-tau@exemplu.com"
            }
            className="h-12 min-h-12 border-slate-300 px-3"
            aria-invalid={error ? true : undefined}
          />
          {tab === "register" ? (
            <p className="text-xs leading-relaxed text-slate-500">
              Cu această adresă vei administra clinica și vei invita colegii.
            </p>
          ) : null}
        </div>

        <input type="hidden" name="purpose" value={tab} />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-slate-900">
              Parolă
            </Label>
            {tab === "login" ? (
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
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              required
              minLength={tab === "register" ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              placeholder={tab === "register" ? "Alege o parolă puternică" : "••••••••"}
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
              aria-invalid={tab === "register" && password.length > 0 && !canSubmitRegister ? true : error ? true : undefined}
              aria-describedby={tab === "register" ? "register-password-rules" : undefined}
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
          {tab === "register" ? (
            <ul id="register-password-rules" className="mt-1 grid gap-1.5">
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

        {tab === "register" ? (
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
              disabled={busy}
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

        {otpSent ? (
          <div className="flex flex-col gap-2">
            <Label htmlFor="otp" className="text-slate-900">
              Cod de acces din email
            </Label>
            <Input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              required={!initialOtpVerified}
              disabled={busy}
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="h-12 min-h-12 border-slate-300 px-3 font-mono tracking-[0.28em]"
            />
            {devCode ? (
              <p className="text-xs text-amber-800">Mediu local, fără Resend: folosește codul {devCode}.</p>
            ) : (
              <p className="text-xs text-slate-500">6 cifre, valabile 10 minute. Verifică și folderul Spam.</p>
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
              Trimite un cod nou
            </button>
          </div>
        ) : null}

        <Button
          type="submit"
          disabled={busy || (tab === "register" && !canSubmitRegister)}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {otpSent
                ? "Se verifică…"
                : tab === "register"
                  ? "Se trimite codul…"
                  : "Se trimite codul…"}
            </>
          ) : otpSent ? (
            "Verifică și continuă"
          ) : tab === "register" ? (
            "Creează cont"
          ) : (
            "Intră în cont"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        <Link href="/acces" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
          Intră cu telefonul.
        </Link>
      </p>
    </div>
  )
}

function AuthModeTab({
  href,
  active,
  children,
}: {
  href: string
  active: boolean
  children: string
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      scroll={false}
      className={cn(
        "inline-flex h-auto min-h-11 items-center justify-center rounded-lg px-2 py-2 text-center text-sm font-medium leading-tight whitespace-normal transition-colors",
        active ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {children}
    </Link>
  )
}
