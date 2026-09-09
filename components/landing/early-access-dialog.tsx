"use client"

import { useState } from "react"
import { KeyRound } from "lucide-react"

import { EarlyAccessForm } from "@/components/landing/early-access-form"
import { Button } from "@/components/ui/button"
import { EARLY_ACCESS_CODE_LENGTH } from "@/lib/auth/early-access-constants"
import { cn } from "@/lib/utils"

export function EarlyAccessButton({
  initialOpen = false,
  className,
}: {
  initialOpen?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(initialOpen)

  return (
    <>
      <Button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("h-12 min-h-[48px] rounded-xl px-6 text-base", className)}
      >
        Early Access
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Închide"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="early-access-title"
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
          >
            <div className="mb-4 flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
                <KeyRound className="size-5" />
              </span>
              <div>
                <h2 id="early-access-title" className="text-lg font-semibold text-slate-900">
                  Early Access
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Introdu codul secret de {EARLY_ACCESS_CODE_LENGTH} caractere. Dacă e valid, vei
                  continua cu adresa de email ca să creezi sau să asociezi contul.
                </p>
              </div>
            </div>
            <EarlyAccessForm submitLabel="Continuă" />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Anulează
            </button>
          </div>
        </div>
      ) : null}
    </>
  )
}
