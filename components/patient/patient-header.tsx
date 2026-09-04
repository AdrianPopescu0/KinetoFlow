"use client"

import { BookOpen } from "lucide-react"

import { logoutPatient } from "@/app/acces/actions"
import { Logo } from "@/components/Logo"
import { PendingSubmitButton } from "@/components/ui/pending-submit-button"
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
            <form
              action={async () => {
                clearStoredPatientToken()
                await logoutPatient()
              }}
            >
              <PendingSubmitButton
                type="submit"
                pendingLabel="Ieșire…"
                className="h-10 rounded-xl border-transparent bg-white/10 text-white hover:bg-white/15 hover:text-white"
              >
                Ieșire
              </PendingSubmitButton>
            </form>
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
      </div>
    </header>
  )
}
