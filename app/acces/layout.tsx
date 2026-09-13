"use client"

import type { ReactNode } from "react"

import { PatientThemeProvider } from "@/components/theme/dashboard-theme"
import { ThemeToggle } from "@/components/theme/theme-toggle"

export default function AccesLayout({ children }: { children: ReactNode }) {
  return (
    <PatientThemeProvider>
      <div className="relative flex min-h-full flex-1 flex-col">
        <div className="absolute top-4 right-4 z-10 sm:top-5 sm:right-5">
          <ThemeToggle variant="surface" />
        </div>
        {children}
      </div>
    </PatientThemeProvider>
  )
}
