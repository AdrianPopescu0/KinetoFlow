"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Check, Circle, Eye, EyeOff, Loader2, Mail } from "lucide-react"

import { requestAuthEmailOtpAction } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { persistTherapistInviteToken, readStoredTherapistInviteToken } from "@/lib/clinics/invite-session"
import { emailOtpPageHref, loginHref } from "@/lib/auth/paths"
import { writePendingEmailOtp } from "@/lib/auth/pending-email-otp"
import { evaluateRegisterPassword } from "@/lib/auth/password"
import { LEGAL_ACCEPT_ERROR, LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"

type AuthTab = "login" | "register"

export function LoginForm({
  initialTab,
  initialError = null,
  initialInfo = null,
}: {
  initialTab: AuthTab
  initialError?: string | null
  initialInfo?: string | null
}) {
  const tab = initialTab
  const router = useRouter()
  const [error, setError] = useState<string | null>(initialError)
  const [info, setInfo] = useState<string | null>(initialInfo)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isPending, startTransition] = useTransition()
  const passwordChecks = evaluateRegisterPassword(password)
  const canSubmitRegister = passwordChecks.isValid && acceptedTerms

  useEffect(() => {
    const invite = new URLSearchParams(window.location.search).get("invite")
    if (invite) {
      persistTherapistInviteToken(invite)
    }
  }, [])

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

      formData.set("purpose", tab === "register" ? "register" : "login")
      const requested = await requestAuthEmailOtpAction(formData)
      if (requested?.error) {
        setError(requested.error)
        return
      }

      const email = String(formData.get("email") ?? "").trim().toLowerCase()
      const purpose = tab === "register" ? "register" : "login"
      writePendingEmailOtp({
        email,
        password: String(formData.get("password") ?? ""),
        purpose,
        legalAccept: formData.get(LEGAL_ACCEPT_FIELD) === "on",
        devCode: requested?.devCode,
        inviteToken: readStoredTherapistInviteToken() ?? undefined,
      })
      if (requested?.info) {
        setInfo(requested.info)
      }
      router.push(requested?.continuePath ?? emailOtpPageHref(email, purpose))
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
          <AlertTitle>Cod trimis pe email</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

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
            disabled={isPending}
            placeholder={
              tab === "register"
                ? "exemplu@gmail.com sau email@clinica.ro"
                : "emailul-tau@exemplu.com"
            }
            className="h-12 min-h-12 border-slate-300 px-3"
            aria-invalid={error ? true : undefined}
          />
          <p className="text-xs leading-relaxed text-slate-500">
            După email și parolă îți trimitem un cod de 6 cifre pe email pentru confirmare.
          </p>
        </div>

        <input type="hidden" name="purpose" value={tab === "register" ? "register" : "login"} />

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
              disabled={isPending}
              placeholder={tab === "register" ? "Alege o parolă puternică" : "••••••••"}
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
              aria-invalid={
                tab === "register" && password.length > 0 && !canSubmitRegister
                  ? true
                  : error
                    ? true
                    : undefined
              }
              aria-describedby={tab === "register" ? "register-password-rules" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={isPending}
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
              disabled={isPending}
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
          disabled={isPending || (tab === "register" && !canSubmitRegister)}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se trimite codul…
            </>
          ) : tab === "register" ? (
            "Continuă cu cod pe email"
          ) : (
            "Continuă cu cod pe email"
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
