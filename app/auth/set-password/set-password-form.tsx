"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

import { setInvitePassword } from "@/app/auth/set-password/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { evaluateRegisterPassword } from "@/lib/auth/password"

export function SetPasswordForm() {
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const passwordChecks = evaluateRegisterPassword(password)

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await setInvitePassword(formData)
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Parola nu a putut fi salvată</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-slate-900">
          Parolă nouă
        </Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isPending}
            className="h-12 min-h-12 border-slate-300 px-3 pr-11"
          />
          <button
            type="button"
            className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-500"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <ul className="space-y-1 text-xs text-slate-600">
          {passwordChecks.checks.map((check) => (
            <li key={check.id} className={check.met ? "text-emerald-700" : undefined}>
              {check.met ? "✓" : "○"} {check.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm_password" className="text-slate-900">
          Confirmă parola
        </Label>
        <Input
          id="confirm_password"
          name="confirm_password"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          required
          disabled={isPending}
          className="h-12 min-h-12 border-slate-300 px-3"
        />
      </div>

      <Button
        type="submit"
        disabled={isPending || !passwordChecks.isValid}
        className="h-12 min-h-[48px] w-full rounded-xl font-semibold"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Se salvează…
          </>
        ) : (
          "Salvează parola și intră în clinică"
        )}
      </Button>
    </form>
  )
}
