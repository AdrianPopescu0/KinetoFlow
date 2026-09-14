"use client"

import type { ReactNode } from "react"

import { LandingLocaleProvider } from "@/components/landing/landing-locale"
import { PatientThemeProvider } from "@/components/theme/dashboard-theme"

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <PatientThemeProvider>
      <LandingLocaleProvider>
        <div
          data-landing-page
          className="flex min-h-0 max-w-full flex-1 flex-col overflow-x-hidden scroll-smooth bg-slate-50 text-slate-800 dark:bg-[#0c1615] dark:text-[#e8eeed]"
        >
          {children}
        </div>
      </LandingLocaleProvider>
    </PatientThemeProvider>
  )
}
