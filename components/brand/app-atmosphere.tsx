import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type AppAtmosphereProps = {
  children: ReactNode
  className?: string
}

export function AppAtmosphere({ children, className }: AppAtmosphereProps) {
  return (
    <div
      className={cn(
        "relative isolate flex min-h-full flex-1 flex-col overflow-x-hidden bg-emerald-950 text-white",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,#064e3b_0%,#042f2e_48%,#022c22_100%)]" />
      <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[-4rem] bottom-[-3rem] size-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="relative flex min-h-full flex-1 flex-col">{children}</div>
    </div>
  )
}

export function glassCardClassName(extra?: string) {
  return cn(
    "rounded-2xl border border-white/10 bg-white/5 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md",
    extra,
  )
}
