"use client"

import { Moon, Sun } from "lucide-react"

import { useAppTheme } from "@/components/theme/dashboard-theme"
import { cn } from "@/lib/utils"

export function ThemeToggle({
  variant = "onDark",
  className,
}: {
  variant?: "onDark" | "surface"
  className?: string
}) {
  const { resolved, setPreference } = useAppTheme()
  const next = resolved === "dark" ? "light" : "dark"
  const Icon = resolved === "dark" ? Sun : Moon
  const label = next === "dark" ? "Activează modul întuneric" : "Activează modul luminos"

  return (
    <button
      type="button"
      onClick={() => setPreference(next)}
      aria-label={label}
      aria-pressed={resolved === "dark"}
      title={label}
      className={cn(
        "inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
        variant === "onDark"
          ? "bg-white/10 text-white hover:bg-white/15"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)] dark:text-[var(--kf-text)] dark:hover:bg-[var(--kf-raised)]",
        className,
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      <span className="hidden sm:inline">{resolved === "dark" ? "Luminos" : "Întuneric"}</span>
    </button>
  )
}
