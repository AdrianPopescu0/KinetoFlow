"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { AlertCircle, Eye, EyeOff, Loader2, Mail } from "lucide-react"

import { login } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"

export function LoginForm({
  initialError = null,
  initialInfo = null,
}: {
  initialError?: string | null
  initialInfo?: string | null
}) {
  const [error, setError] = useState<string | null>(initialError)
  const [info, setInfo] = useState<string | null>(initialInfo)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const [googlePending, setGooglePending] = useState(false)
  const busy = isPending || googlePending

  const handleGoogleLogin = async () => {
    setError(null)
    setInfo(null)
    setGooglePending(true)

    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (oauthError) {
        console.error("Eroare la logarea cu Google:", oauthError.message)
        setError("Nu am putut porni autentificarea cu Google. Încearcă din nou.")
        setGooglePending(false)
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : String(caught)
      console.error("Eroare la logarea cu Google:", message)
      setError("Nu am putut porni autentificarea cu Google. Încearcă din nou.")
      setGooglePending(false)
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setInfo(null)

    startTransition(async () => {
      const result = await login(formData)
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
      {error ? (
        <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
          <AlertCircle />
          <AlertTitle>Autentificare eșuată</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {info ? (
        <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
          <Mail />
          <AlertTitle>Confirmă adresa de email</AlertTitle>
          <AlertDescription>{info}</AlertDescription>
        </Alert>
      ) : null}

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
        {googlePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <GoogleMark className="size-5" />
        )}
        Sign in with Google
      </Button>

      <div className="flex items-center gap-3" role="separator" aria-label="sau">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium tracking-wide text-slate-500 uppercase">sau</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-slate-900">
            Adresa de email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={busy}
            placeholder="emailul-tau@exemplu.com"
            className="h-12 min-h-12 border-slate-300 px-3"
            aria-invalid={error ? true : undefined}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="password" className="text-slate-900">
              Parolă
            </Label>
            <Link
              href="/recuperare-parola"
              className="text-sm font-medium text-[#042f2e] underline-offset-4 hover:underline"
            >
              Ai uitat parola?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={busy}
              placeholder="••••••••"
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
              aria-invalid={error ? true : undefined}
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
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se autentifică…
            </>
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
