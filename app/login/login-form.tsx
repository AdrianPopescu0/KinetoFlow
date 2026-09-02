"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react"

import { login, register } from "@/app/login/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type AuthTab = "login" | "register"

export function LoginForm({ initialTab }: { initialTab: AuthTab }) {
  const router = useRouter()
  const [tab, setTab] = useState<AuthTab>(initialTab)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()

  function switchTab(next: AuthTab) {
    setTab(next)
    setError(null)
    setInfo(null)
    router.replace(next === "register" ? "/login?tab=register" : "/login", { scroll: false })
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    setInfo(null)

    startTransition(async () => {
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
            ) : (
              <span className="text-xs text-slate-500">Minim 6 caractere</span>
            )}
          </div>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={tab === "register" ? "new-password" : "current-password"}
              required
              minLength={6}
              disabled={isPending}
              placeholder={tab === "register" ? "Minim 6 caractere" : "••••••••"}
              className="h-12 min-h-12 border-slate-300 px-3 pr-12"
              aria-invalid={error ? true : undefined}
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
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="h-12 min-h-[48px] w-full rounded-xl text-sm font-semibold"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {tab === "register" ? "Se creează contul…" : "Se autentifică…"}
            </>
          ) : tab === "register" ? (
            "Creează contul clinicii"
          ) : (
            "Intră în cont"
          )}
        </Button>
      </form>
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
