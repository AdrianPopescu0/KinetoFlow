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
import { cn } from "@/lib/utils"

type AuthTab = "login" | "register"

export function LoginForm({ initialTab }: { initialTab: AuthTab }) {
  const router = useRouter()
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [isPending, startTransition] = useTransition()
  const passwordChecks = evaluateRegisterPassword(password)
  const canSubmitRegister = passwordChecks.isValid

  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  function switchTab(next: AuthTab) {
    setTab(next)
    setError(null)
    setInfo(null)
    setPassword("")
    router.replace(loginHref(next === "register" ? "signup" : "signin"), { scroll: false })
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setInfo(null)

    startTransition(async () => {
      if (tab === "register" && !evaluateRegisterPassword(String(formData.get("password") ?? "")).isValid) {
        setError("Parola trebuie să aibă minim 8 caractere, o majusculă, o cifră și un caracter special.")
        return
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

      <form action={handleSubmit} className="flex flex-col gap-5" noValidate>
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

        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-slate-900">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            disabled={isPending}
            placeholder="nume@clinica.ro"
            className="h-12 min-h-12 border-slate-300 px-3"
            aria-invalid={error ? true : undefined}
          />
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
              disabled={isPending}
              placeholder={tab === "register" ? "Alege o parolă puternică" : "••••••••"}
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
              aria-invalid={tab === "register" && password.length > 0 && !canSubmitRegister ? true : error ? true : undefined}
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

        <Button
          type="submit"
          disabled={isPending || (tab === "register" && !canSubmitRegister)}
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
