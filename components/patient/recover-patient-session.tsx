"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Logo } from "@/components/Logo"
import { PatientThemeProvider } from "@/components/theme/dashboard-theme"
import { PatientSettingsButton } from "@/components/patient/patient-settings"
import { patientPublicPath } from "@/lib/patients/session"
import { readStoredPatientToken } from "@/lib/patients/token-storage"

export function RecoverPatientSession() {
  const router = useRouter()
  const [status, setStatus] = useState<"searching" | "missing">("searching")

  useEffect(() => {
    const token = readStoredPatientToken()
    if (token) {
      router.replace(patientPublicPath(token))
      return
    }
    setStatus("missing")
  }, [router])

  return (
    <PatientThemeProvider>
    <div className="relative flex min-h-full flex-1 flex-col bg-slate-50 dark:bg-[var(--kf-canvas)]">
      <div className="absolute top-4 right-4 z-10 sm:top-5 sm:right-5">
        <PatientSettingsButton variant="surface" />
      </div>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 inline-flex items-center">
          <Logo size="md" />
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]">
          {status === "searching" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-[var(--kf-text)]">
                Reîncărcăm programul
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[var(--kf-text-muted)]">
                Linkul din WhatsApp sau Facebook a pierdut tokenul. Căutăm sesiunea salvată pe
                acest dispozitiv…
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-[var(--kf-text)]">
                Link incomplet
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-[var(--kf-text-muted)]">
                Deschide din nou linkul primit de la terapeut sau intră cu telefonul și codul de 8
                cifre.
              </p>
              <Link
                href="/acces"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
              >
                Acces cu telefon și cod
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
    </PatientThemeProvider>
  )
}
