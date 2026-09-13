"use client"

import { useState } from "react"
import { Settings, X } from "lucide-react"

import { ThemePreferenceSection } from "@/components/theme/dashboard-theme"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function PatientSettingsButton({
  variant = "onDark",
  className,
}: {
  variant?: "onDark" | "surface"
  className?: string
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
          "inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
          variant === "onDark"
            ? "bg-white/10 text-white hover:bg-white/15"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)] dark:text-[var(--kf-text)] dark:hover:bg-[var(--kf-raised)]",
          className,
        )}
      >
        <Settings className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Setări</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="max-h-[min(90vh,36rem)] overflow-y-auto dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]">
          <DialogClose
            className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[var(--kf-raised)] dark:hover:text-[var(--kf-text)]"
            aria-label="Închide"
          >
            <X className="size-4" />
          </DialogClose>

          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase dark:text-teal-300">
            Cont pacient
          </p>
          <DialogTitle className="mt-1 dark:text-[var(--kf-text)]">Setări</DialogTitle>
          <DialogDescription className="mt-1.5 dark:text-[var(--kf-text-muted)]">
            Alege tema programului. Preferința se păstrează pe acest dispozitiv.
          </DialogDescription>

          <div className="mt-5">
            <ThemePreferenceSection
              standalone
              description="Alege modul luminos, întuneric sau automat — același stil ca în panoul clinicii. Se aplică imediat."
            />
          </div>
        </DialogPopup>
      </Dialog>
    </>
  )
}
