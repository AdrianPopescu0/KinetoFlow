"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, Settings, X } from "lucide-react"

import { ThemePreferenceSection } from "@/components/theme/dashboard-theme"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function TherapistSettingsButton({
  className,
  active = false,
}: {
  className?: string
  active?: boolean
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Deschide setările"
        className={cn(
          "inline-flex h-11 min-h-[44px] items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-white transition-colors",
          active ? "bg-white/15" : "bg-white/10 hover:bg-white/15",
          className,
        )}
      >
        <Settings className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Setări</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="max-h-[min(90vh,40rem)] overflow-y-auto dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]">
          <DialogClose
            className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[var(--kf-raised)] dark:hover:text-[var(--kf-text)]"
            aria-label="Închide"
          >
            <X className="size-4" />
          </DialogClose>

          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase dark:text-teal-300">
            Cont terapeut
          </p>
          <DialogTitle className="mt-1 dark:text-[var(--kf-text)]">Setări</DialogTitle>
          <DialogDescription className="mt-1.5 dark:text-[var(--kf-text-muted)]">
            Schimbă tema panoului sau deschide datele contului, parola și preferințele clinicii.
          </DialogDescription>

          <div className="mt-5">
            <ThemePreferenceSection
              standalone
              description="Comută rapid între luminos și întuneric sau lasă tema să urmeze dispozitivul."
            />
          </div>

          <Link
            href="/dashboard/setari"
            onClick={() => setOpen(false)}
            className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:hover:bg-[var(--kf-surface)]"
          >
            <span>
              <span className="block text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">
                Setări cont
              </span>
              <span className="mt-0.5 block text-xs text-slate-600 dark:text-[var(--kf-text-muted)]">
                Nume, telefon, parolă și numele cabinetului.
              </span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
          </Link>
        </DialogPopup>
      </Dialog>
    </>
  )
}
