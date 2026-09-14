"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { Monitor, Moon, Sun } from "lucide-react"

import { persistAccountTheme } from "@/app/dashboard/setari/actions"
import { cn } from "@/lib/utils"
import {
  applyResolvedTheme,
  parseThemePreference,
  resolveTheme,
  THEME_STORAGE_KEY,
  writeThemePreference,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme/preference"

type ThemeContextValue = {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (next: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function DashboardThemeProvider({
  initialPreference = "system",
  persistAccount = true,
  children,
}: {
  initialPreference?: ThemePreference
  persistAccount?: boolean
  children: ReactNode
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference)
  const [resolved, setResolved] = useState<ResolvedTheme>(() =>
    resolveTheme(initialPreference, false),
  )

  useEffect(() => {
    const stored = parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY), initialPreference)
    setPreferenceState(stored)
    writeThemePreference(stored)
    const next = resolveTheme(stored, systemPrefersDark())
    setResolved(next)
    applyResolvedTheme(next)
  }, [initialPreference])

  useEffect(() => {
    const next = resolveTheme(preference, systemPrefersDark())
    setResolved(next)
    applyResolvedTheme(next)
    if (preference !== "system") {
      return
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function onChange() {
      const fromSystem = resolveTheme("system", media.matches)
      setResolved(fromSystem)
      applyResolvedTheme(fromSystem)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  useEffect(() => {
    return () => {
      applyResolvedTheme("light")
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      setPreference(next) {
        setPreferenceState(next)
        writeThemePreference(next)
        const applied = resolveTheme(next, systemPrefersDark())
        setResolved(applied)
        applyResolvedTheme(applied)
        if (persistAccount) {
          void persistAccountTheme(next)
        }
      },
    }),
    [persistAccount, preference, resolved],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function PatientThemeProvider({
  initialPreference = "system",
  children,
}: {
  initialPreference?: ThemePreference
  children: ReactNode
}) {
  return (
    <DashboardThemeProvider initialPreference={initialPreference} persistAccount={false}>
      {children}
    </DashboardThemeProvider>
  )
}

export function useAppTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useAppTheme trebuie folosit într-un ThemeProvider.")
  }
  return context
}

export function useDashboardTheme() {
  return useAppTheme()
}

const OPTIONS: Array<{
  value: ThemePreference
  label: string
  description: string
  icon: typeof Sun
}> = [
  {
    value: "light",
    label: "Mod luminos",
    description: "Fundal deschis, potrivit zilei.",
    icon: Sun,
  },
  {
    value: "dark",
    label: "Mod întuneric",
    description: "Contrast redus pentru seară.",
    icon: Moon,
  },
  {
    value: "system",
    label: "Mod automat",
    description: "Urmărește tema telefonului sau a calculatorului.",
    icon: Monitor,
  },
]

export function ThemeModeToggle() {
  const { resolved, setPreference } = useDashboardTheme()
  const dark = resolved === "dark"

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)]">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Mod întuneric</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-[var(--kf-text-muted)]">
          {dark ? "Panoul folosește tema întunecată." : "Panoul folosește tema luminoasă."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label="Comută modul întuneric"
        onClick={() => setPreference(dark ? "light" : "dark")}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-[#042f2e]/40 focus-visible:outline-none",
          dark ? "bg-[#042f2e] dark:bg-teal-400" : "bg-slate-300 dark:bg-slate-600",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 flex size-6 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-transform",
            dark && "translate-x-5 text-[#042f2e]",
          )}
        >
          {dark ? <Moon className="size-3.5" aria-hidden="true" /> : <Sun className="size-3.5" aria-hidden="true" />}
        </span>
      </button>
    </div>
  )
}

export function ThemePreferenceSection({
  standalone = false,
  description = "Alege tema panoului. Se aplică imediat pe tot dashboard-ul.",
}: {
  standalone?: boolean
  description?: string
}) {
  const { preference, setPreference } = useDashboardTheme()

  return (
    <section
      className={cn(
        "flex flex-col gap-4",
        !standalone && "border-t border-slate-200 pt-6 dark:border-[var(--kf-border)]",
      )}
    >
      <div>
        <h2 className="text-base font-semibold text-slate-800 dark:text-[var(--kf-text)]">Aspect</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">{description}</p>
      </div>
      <ThemeModeToggle />
      <div role="radiogroup" aria-label="Tema aplicației" className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option, index) => {
          const selected = preference === option.value
          const Icon = option.icon
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => setPreference(option.value)}
              onKeyDown={(event) => {
                if (
                  event.key !== "ArrowRight" &&
                  event.key !== "ArrowLeft" &&
                  event.key !== "ArrowDown" &&
                  event.key !== "ArrowUp"
                ) {
                  return
                }
                event.preventDefault()
                const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1
                const next = OPTIONS[(index + direction + OPTIONS.length) % OPTIONS.length]
                setPreference(next.value)
              }}
              className={cn(
                "flex min-h-[5.5rem] flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition-colors",
                selected
                  ? "border-[#042f2e] bg-teal-50 ring-1 ring-[#042f2e] dark:border-teal-400 dark:bg-[#1f2e2c] dark:ring-teal-400"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)] dark:hover:bg-[var(--kf-raised)]",
              )}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-[var(--kf-text)]">
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {option.label}
              </span>
              <span className="text-xs leading-relaxed text-slate-600 dark:text-[var(--kf-text-muted)]">{option.description}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
