"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Check, Circle, Eye, EyeOff, Loader2 } from "lucide-react"

import { acceptTherapistInvite } from "@/app/auth/invitatie/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { inviteAcceptGoesToDashboard } from "@/lib/auth/accept-invite"
import { evaluateRegisterPassword } from "@/lib/auth/password"
import { LEGAL_ACCEPT_FIELD } from "@/lib/auth/validation"
import { INVITE_TOKEN_FIELD, persistTherapistInviteToken } from "@/lib/clinics/invite-session"
import { cn } from "@/lib/utils"

export function AcceptTherapistInviteForm({
  token,
  inviteEmail,
  initialError = null,
}: {
  token: string
  inviteEmail: string | null
  initialError?: string | null
}) {
  const [error, setError] = useState<string | null>(initialError)
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [isPending, startTransition] = useTransition()
  const passwordChecks = evaluateRegisterPassword(password)
  const canActivate = Boolean(inviteEmail) && passwordChecks.isValid && acceptedTerms
  persistTherapistInviteToken(token)

  function handleActivate(formData: FormData) {
    setError(null)
    formData.set(INVITE_TOKEN_FIELD, token)
    formData.set("password", password)
    if (acceptedTerms) {
      formData.set(LEGAL_ACCEPT_FIELD, "on")
    }

    startTransition(async () => {
      try {
        const result = await acceptTherapistInvite(token, formData)
        if (result?.error) {
          console.error("[invite-activate]", result.error)
          setError(result.error)
          return
        }
        if (inviteAcceptGoesToDashboard(result)) {
          window.location.assign("/dashboard")
          return
        }
        console.error("[invite-activate] răspuns neașteptat după activare", result)
        setError("Nu am putut deschide dashboard-ul clinicii. Reîncearcă sau cere un link nou.")
      } catch (error) {
        const digest =
          typeof error === "object" && error && "digest" in error
            ? String((error as { digest?: string }).digest ?? "")
            : ""
        if (digest.startsWith("NEXT_REDIRECT")) {
          throw error
        }
        const message = error instanceof Error ? error.message : "Nu am putut activa invitația."
        console.error("[invite-activate]", error)
        setError(message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Nu am putut activa contul</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!inviteEmail ? (
        <Alert className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertCircle />
          <AlertTitle>Lipsește emailul de pe invitație</AlertTitle>
          <AlertDescription>
            Cere administratorului un link nou, cu adresa ta, ca să poți alege parola și să activezi
            contul.
          </AlertDescription>
        </Alert>
      ) : null}

      <form action={handleActivate} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name={INVITE_TOKEN_FIELD} value={token} />
        <input type="hidden" name={LEGAL_ACCEPT_FIELD} value={acceptedTerms ? "on" : ""} />

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

        <div className="flex flex-col gap-2">
          <Label htmlFor="invite-email" className="text-slate-900">
            Email
          </Label>
          <Input
            id="invite-email"
            name="email"
            type="email"
            readOnly
            disabled
            value={inviteEmail ?? ""}
            autoComplete="username"
            className="h-12 min-h-12 border-slate-300 bg-slate-50 px-3"
          />
          <p className="text-xs leading-relaxed text-slate-500">
            Adresa vine din invitație. Nu trimitem un cod pe email — activezi contul aici, cu parola.
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
              disabled={isPending || !inviteEmail}
              placeholder="Alege o parolă puternică"
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={isPending || !inviteEmail}
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

        <Button
          type="submit"
          disabled={isPending || !canActivate}
          className="h-12 min-h-[48px] w-full rounded-xl font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se activează…
            </>
          ) : (
            "Activează contul și intră în clinică"
          )}
        </Button>
      </form>
    </div>
  )
}
