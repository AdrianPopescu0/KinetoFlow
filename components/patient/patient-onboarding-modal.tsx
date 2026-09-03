"use client"

import { useState, useSyncExternalStore } from "react"
import { Activity, ArrowLeft, ArrowRight, PlayCircle, ClipboardList } from "lucide-react"

import {
  markOnboardingSeen,
  onboardingSeenServerSnapshot,
  patientOnboardingKey,
  readOnboardingSeen,
  subscribeOnboardingFlag,
} from "@/lib/onboarding/seen-flag"
import { cn } from "@/lib/utils"

const STEPS = [
  {
    icon: ClipboardList,
    title: "Exercițiile tale de recuperare",
    text: "Aici găsești programul stabilit de kinetoterapeutul tău, explicat pas cu pas.",
  },
  {
    icon: PlayCircle,
    title: "Execută corect fiecare mișcare",
    text: "Apasă pe fiecare exercițiu pentru a vedea clipul video, numărul de repetări și sfaturile de execuție.",
  },
  {
    icon: Activity,
    title: "Evaluează durerea la final",
    text: "După sesiune, notează nivelul de disconfort pe scala VAS (1-10) pentru ca terapeutul să îți ajusteze programul.",
  },
] as const

export function PatientOnboardingModal({ patientKey }: { patientKey: string }) {
  const storageKey = patientOnboardingKey(patientKey)
  const seen = useSyncExternalStore(
    subscribeOnboardingFlag,
    () => readOnboardingSeen(storageKey),
    onboardingSeenServerSnapshot,
  )
  const [step, setStep] = useState(0)

  if (seen || !patientKey) {
    return null
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-onboarding-title"
        className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white px-5 pt-6 pb-8 shadow-xl sm:rounded-3xl sm:px-7"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />

        <div className="mt-6 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-[#042f2e]">
            <Icon className="size-8" />
          </span>
          <h2 id="patient-onboarding-title" className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            {current.title}
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{current.text}</p>
        </div>

        <div className="mt-7 flex items-center justify-center gap-2" aria-hidden="true">
          {STEPS.map((item, index) => (
            <span
              key={item.title}
              className={cn(
                "h-2 rounded-full transition-all",
                index === step ? "w-6 bg-[#042f2e]" : "w-2 bg-slate-300",
              )}
            />
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3">
          {isLast ? (
            <button
              type="button"
              onClick={() => markOnboardingSeen(storageKey)}
              className="inline-flex h-14 min-h-[56px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-base font-semibold text-white active:bg-emerald-700"
            >
              Începe Exercițiile
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setStep((value) => Math.min(STEPS.length - 1, value + 1))}
              className="inline-flex h-14 min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-[#042f2e] px-4 text-base font-semibold text-white active:bg-[#064e3b]"
            >
              Următorul
              <ArrowRight className="size-5" />
            </button>
          )}

          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((value) => Math.max(0, value - 1))}
              className="inline-flex h-12 min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 text-sm font-medium text-slate-700"
            >
              <ArrowLeft className="size-4" />
              Înapoi
            </button>
          ) : (
            <button
              type="button"
              onClick={() => markOnboardingSeen(storageKey)}
              className="h-11 text-sm font-medium text-slate-500 underline-offset-4 active:underline"
            >
              Sari peste
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
