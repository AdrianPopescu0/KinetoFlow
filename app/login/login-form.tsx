"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react"

import { login, register } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { loginHref } from "@/lib/auth/paths"
import { evaluateRegisterPassword } from "@/lib/auth/password"
import { LEGAL_ACCEPT_ERROR, LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

type AuthTab = "login" | "register"

export function LoginForm({
  initialTab,
  initialError = null,
}: {
  initialTab: AuthTab
  initialError?: string | null
}) {
  const router = useRouter()
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [error, setError] = useState<string | null>(initialError)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [googlePending, setGooglePending] = useState(false)
  const passwordChecks = evaluateRegisterPassword(password)
  const canSubmitRegister = passwordChecks.isValid && acceptedTerms
  const busy = isPending || googlePending

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  function switchTab(next: AuthTab) {
    setTab(next)
    setError(null)
    setInfo(null)
    setPassword("")
    setAcceptedTerms(false)
    router.replace(loginHref(next === "register" ? "signup" : "signin"), { scroll: false })
  }

  const handleGoogleLogin = async () => {
    if (tab === "register" && !acceptedTerms) {
      setError(LEGAL_ACCEPT_ERROR)
      return
    }

    setError(null)
    setInfo(null)
    setGooglePending(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
      const result = tab === "register" ? await register(formData) : await login(formData)
      if (result?.error) {
        setError(result.error)
      }
      if (result?.info) {
        setInfo(result.info)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="Autentificare sau înregistrare"
        className="grid grid-cols-2 rounded-xl border border-slate-200 bg-slate-50 p-1"
      >
        <TabButton active={tab === "login"} onClick={() => switchTab("login")}>
          Intră în cont
        </TabButton>
        <TabButton active={tab === "register"} onClick={() => switchTab("register")}>
          Înregistrează clinică nouă
        </TabButton>
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
          <AlertTitle>Verifică emailul</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => {
          void handleGoogleLogin()
        }}
        className="h-12 min-h-[48px] w-full rounded-xl border-slate-300 bg-white text-sm font-semibold text-slate-800"
      >
        {googlePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark className="size-5" />
        )}
        Continuă cu Google
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

        <Button
          type="submit"
          disabled={busy || (tab === "register" && !canSubmitRegister)}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {tab === "register" ? "Se creează contul…" : "Se autentifică…"}
            </>
          ) : tab === "register" ? (
            "Creează cont"
          ) : (
            "Intră în cont"
          )}
        </Button>
      </form>

      {tab === "register" ? (
        <p className="text-center text-sm text-slate-600">
          Ai deja cont?{" "}
          <button
            type="button"
            onClick={() => switchTab("login")}
            className="font-medium text-[#042f2e] underline-offset-4 hover:underline"
          >
            Conectează-te
          </button>
        </p>
      ) : (
        <p className="text-center text-sm text-slate-600">
          Nu ai cont?{" "}
          <button
            type="button"
            onClick={() => switchTab("register")}
            className="font-medium text-[#042f2e] underline-offset-4 hover:underline"
          >
            Creează clinică nouă
          </button>
        </p>
      )}
    </div>
  )
}

function TabButton({
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

function GoogleMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}
