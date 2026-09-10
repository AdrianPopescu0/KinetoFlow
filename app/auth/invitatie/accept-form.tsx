"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react"

import { acceptTherapistInvite, prepareTherapistInviteOAuth } from "@/app/auth/invitatie/actions"
import { GoogleMark } from "@/components/auth/google-mark"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { oauthBrowserRedirectTo } from "@/lib/auth/oauth-redirect"
import { persistTherapistInviteToken, THERAPIST_INVITE_PATH } from "@/lib/clinics/invite-session"
import { evaluateRegisterPassword } from "@/lib/auth/password"
import { LEGAL_ACCEPT_ERROR, LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/client"

export function AcceptTherapistInviteForm({
  token,
  initialError = null,
}: {
  token: string
  initialError?: string | null
}) {
  const [error, setError] = useState<string | null>(initialError)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [googlePending, setGooglePending] = useState(false)
  const passwordChecks = evaluateRegisterPassword(password)
  const busy = isPending || googlePending
  const canSubmit = passwordChecks.isValid && acceptedTerms
  persistTherapistInviteToken(token)

  async function handleGoogleLogin() {
    if (!acceptedTerms) {
      setError(LEGAL_ACCEPT_ERROR)
      return
    }

    setError(null)
    setGooglePending(true)
    persistTherapistInviteToken(token)
    const prepared = await prepareTherapistInviteOAuth(token)
    if (prepared?.error) {
      setError(prepared.error)
      setGooglePending(false)
      return
    }

    try {
      const supabase = createClient()
      try {
        await supabase.auth.signOut()
      } catch {
        // Continuăm cu Google chiar dacă deconectarea locală eșuează.
      }
      persistTherapistInviteToken(token)
      const restamped = await prepareTherapistInviteOAuth(token)
      if (restamped?.error) {
        setError(restamped.error)
        setGooglePending(false)
        return
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: oauthBrowserRedirectTo(window.location.origin, {
            next: `${THERAPIST_INVITE_PATH}/${token}`,
            invite: token,
          }),
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

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      persistTherapistInviteToken(token)
      if (!evaluateRegisterPassword(String(formData.get("password") ?? "")).isValid) {
        setError("Parola trebuie să aibă minim 8 caractere, o majusculă, o cifră și un caracter special.")
        return
      }
      if (formData.get(LEGAL_ACCEPT_FIELD) !== "on") {
        setError(LEGAL_ACCEPT_ERROR)
        return
      }
      const result = await acceptTherapistInvite(token, formData)
      if (result?.error) {
        setError(result.error)
        return
      }
      persistTherapistInviteToken(token)
      window.location.replace("/dashboard")
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut crea contul</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

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
        Sign In with Google
      </Button>

      <div className="flex items-center gap-3" role="separator" aria-label="sau">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">sau</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name={LEGAL_ACCEPT_FIELD} value={acceptedTerms ? "on" : ""} />
        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email" className="text-slate-900">
            Emailul tău personal
          </Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={busy}
            placeholder="emailul-tau@exemplu.com"
            className="h-12 min-h-12 border-slate-300 px-3"
          />
          <p className="text-xs leading-relaxed text-slate-500">
            Cu Google sau cu această adresă vei intra ulterior în clinică. Administratorul nu îți
            creează contul — o faci tu aici.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-password" className="text-slate-900">
            Alege o parolă
          </Label>
          <div className="relative">
            <Input
              id="invite-password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              placeholder="Alege o parolă puternică"
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={busy}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-50"
              aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <ul className="mt-1 grid gap-1.5">
            {passwordChecks.checks.map((check) => (
              <li
                key={check.id}
                className={cn("flex items-center gap-2 text-xs", check.met ? "text-emerald-700" : "text-slate-400")}
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
        </div>

        <Button type="submit" disabled={busy || !canSubmit} className="h-12 min-h-[48px] w-full rounded-xl font-semibold">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se creează contul…
            </>
          ) : (
            "Creează contul și intră în clinică"
          )}
        </Button>
      </form>
    </div>
  )
}
