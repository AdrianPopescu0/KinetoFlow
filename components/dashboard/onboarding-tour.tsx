"use client"

import { useState, useSyncExternalStore } from "react"
import { ArrowLeft, ArrowRight, MessageCircle, Sparkles, UserPlus, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  markOnboardingSeen,
  onboardingSeenServerSnapshot,
  readOnboardingSeen,
  subscribeOnboardingFlag,
  therapistOnboardingKey,
} from "@/lib/onboarding/seen-flag"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    icon: Sparkles,
    title: "Bun venit în cabinetul tău digital!",
    text: "Aici gestionezi toți pacienții clinicii, urmărești scorurile de durere (VAS) și complianța la exerciții în timp real.",
  },
  {
    icon: UserPlus,
    title: "Creează rapid primul pacient",
    text: "Folosește butonul „+ Adaugă Pacient” din colțul din dreapta sus pentru a introduce diagnosticul și datele de contact.",
  },
  {
    icon: Users,
    title: "Colaborare simplă între colegi",
    text: "Poți lăsa pacienții la comun în cabinet sau îi poți asigna direct unui terapeut din dropdown. Tab-ul „Pacienții mei” îți afișează exclusiv cazurile tale.",
  },
  {
    icon: MessageCircle,
    title: "Acces instant pentru pacient",
    text: "Apasă pe „Copiază Link Acces” sau folosește opțiunea de trimitere pe WhatsApp. Pacientul intră direct pe link, fără conturi sau parole greoaie.",
  },
] as const

export function OnboardingTour({ userId }: { userId: string }) {
  const storageKey = therapistOnboardingKey(userId)
  const seen = useSyncExternalStore(
    subscribeOnboardingFlag,
    () => readOnboardingSeen(storageKey),
    onboardingSeenServerSnapshot,
  )
  const [step, setStep] = useState(0)

  if (seen || !userId) {
    return null
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  function finish() {
    markOnboardingSeen(storageKey)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-tour-title"
        className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-center gap-2" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                index <= step ? "bg-[#042f2e]" : "bg-slate-200",
              )}
            />
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          Pasul {step + 1} din {STEPS.length}
        </p>

        <div className="mt-3 flex items-start gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
            <Icon className="size-6" />
          </span>
          <div>
            <h2 id="onboarding-tour-title" className="text-xl font-semibold tracking-tight text-slate-900">
              {current.title}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{current.text}</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          {isLast ? (
            <span />
          ) : (
            <button
              type="button"
              onClick={finish}
              className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
            >
              Sari peste
            </button>
          )}

          <div className="flex items-center gap-2">
            {step > 0 ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((current) => Math.max(0, current - 1))}
                className="h-11 rounded-xl"
              >
                <ArrowLeft className="size-4" />
                Înapoi
              </Button>
            ) : null}

            {isLast ? (
              <Button type="button" onClick={finish} className="h-11 rounded-xl">
                Gata, să începem!
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setStep((current) => Math.min(STEPS.length - 1, current + 1))}
                className="h-11 rounded-xl"
              >
                Următorul
                <ArrowRight className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
