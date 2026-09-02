"use client"

import { useState, useTransition } from "react"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

import { register } from "@/app/register/actions"
import { AuthDivider } from "@/components/auth/auth-divider"
import { GoogleAuthButton } from "@/components/auth/google-button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    setInfo(null)

    startTransition(async () => {
      const result = await register(formData)
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
      <GoogleAuthButton label="Continuă cu Google" />
      <AuthDivider />

      <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
        {error ? (
          <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
            <AlertCircle />
            <AlertTitle>Nu am putut crea contul</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {info ? (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
            <AlertTitle>Verifică emailul</AlertTitle>
            <AlertDescription>{info}</AlertDescription>
          </Alert>
        ) : null}

        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nume@clinica.ro"
          disabled={isPending}
        />
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Parolă</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              disabled={isPending}
              placeholder="Minim 8 caractere"
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              disabled={isPending}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-900 disabled:opacity-50"
              aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
        <Field
          id="confirm_password"
          label="Confirmă parola"
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Repetă parola"
          disabled={isPending}
        />

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se creează contul…
            </>
          ) : (
            "Creează cont"
          )}
        </Button>
      </form>
    </div>
  )
}

function Field({
  id,
  label,
  type,
  autoComplete,
  placeholder,
  disabled,
}: {
  id: string
  label: string
  type: string
  autoComplete: string
  placeholder: string
  disabled: boolean
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        placeholder={placeholder}
        className="h-12 min-h-12 border-slate-300 px-3"
      />
    </div>
  )
}
