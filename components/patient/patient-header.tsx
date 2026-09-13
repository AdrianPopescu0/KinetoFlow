"use client"

import { BookOpen } from "lucide-react"

import { logoutPatient } from "@/app/acces/actions"
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button"
import { InstallPWAButton } from "@/components/InstallPWAButton"
import { Logo } from "@/components/Logo"
import { PatientSettingsButton } from "@/components/patient/patient-settings"
import { clearStoredPatientToken } from "@/lib/patients/token-storage"

type PatientHeaderProps = {
  firstName: string
  dateLabel: string
  onOpenGuide?: () => void
}

export function PatientHeader({ firstName, dateLabel, onOpenGuide }: PatientHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-[#042f2e] text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-3">
          <Logo size="md" variant="onDark" />
          <div className="flex items-center gap-2">
            <PatientSettingsButton variant="onDark" />
            {onOpenGuide ? (
              <button
                type="button"
                onClick={onOpenGuide}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3 text-sm font-medium text-white hover:bg-white/15 lg:hidden"
              >
                <BookOpen className="size-4" />
                Ghid recuperare
              </button>
            ) : null}
            <LogoutConfirmButton
              label="Ieșire"
              triggerVariant="onDark"
              onConfirm={async () => {
                clearStoredPatientToken()
                await logoutPatient()
              }}
            />
            <p className="hidden text-right text-xs text-teal-50/80 sm:block">{dateLabel}</p>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 className="text-[1.55rem] leading-tight font-semibold tracking-tight">Bună, {firstName}!</h1>
            <p className="mt-1 text-sm text-teal-50/85">Iată planul tău de recuperare pentru azi.</p>
          </div>
          <p className="text-right text-xs text-teal-50/80 sm:hidden">{dateLabel}</p>
        </div>
        <InstallPWAButton variant="onDark" className="sm:self-start" />
      </div>
    </header>
  )
}
