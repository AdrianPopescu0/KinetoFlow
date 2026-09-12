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
  themeCookieWrite,
  type ThemePreference,
} from "@/lib/theme/preference"

type ThemeContextValue = {
  preference: ThemePreference
  setPreference: (next: ThemePreference) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function persistTheme(preference: ThemePreference) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // ignore quota / private mode
  }
  document.cookie = themeCookieWrite(preference)
}

function systemPrefersDark() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

export function DashboardThemeProvider({
  initialPreference = "system",
  children,
}: {
  initialPreference?: ThemePreference
  children: ReactNode
}) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference)

  useEffect(() => {
    const stored = parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY), initialPreference)
    setPreferenceState(stored)
    persistTheme(stored)
    applyResolvedTheme(resolveTheme(stored, systemPrefersDark()))
  }, [initialPreference])

  useEffect(() => {
    applyResolvedTheme(resolveTheme(preference, systemPrefersDark()))
    if (preference !== "system") {
      return
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    function onChange() {
      applyResolvedTheme(resolveTheme("system", media.matches))
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
      setPreference(next) {
        setPreferenceState(next)
        persistTheme(next)
        applyResolvedTheme(resolveTheme(next, systemPrefersDark()))
        void persistAccountTheme(next)
      },
    }),
    [preference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useDashboardTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useDashboardTheme trebuie folosit în dashboard.")
  }
  return context
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

export function ThemePreferenceSection({ standalone = false }: { standalone?: boolean }) {
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
        <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">
          Alege tema panoului. Se aplică imediat pe tot dashboard-ul.
        </p>
      </div>
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
