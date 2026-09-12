import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-0 max-w-full flex-1 flex-col overflow-x-hidden bg-slate-50 text-slate-800 dark:bg-[var(--kf-canvas)] dark:text-[var(--kf-text)]", className)}>
      {children}
    </div>
  )
}

export function surfaceCardClassName(extra?: string) {
  return cn("rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]", extra)
}
