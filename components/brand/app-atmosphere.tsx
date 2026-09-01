import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn("flex min-h-full flex-1 flex-col bg-slate-50 text-slate-800", className)}>
      {children}
    </div>
  )
}

export function surfaceCardClassName(extra?: string) {
  return cn("rounded-2xl border border-slate-200 bg-white shadow-sm", extra)
}
