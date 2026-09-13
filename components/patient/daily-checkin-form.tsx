"use client"

import { useId } from "react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VasScale } from "@/components/patient/vas-scale"
import { ENERGY_OPTIONS, PAIN_KIND_OPTIONS, SLEEP_OPTIONS } from "@/lib/patients/program"
import type { EnergyLevel, PainKind, SleepQuality } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

type DailyCheckinFormProps = {
  pain: number
  sleep: SleepQuality | null
  energy: EnergyLevel | null
  painKind: PainKind | null
  notes: string
  error: string | null
  errorTone?: "error" | "offline"
  pending: boolean
  submitEnabled: boolean
  offline?: boolean
  exercisesDone: number
  exercisesTotal: number
  onPainChange: (value: number) => void
  onSleepChange: (value: SleepQuality) => void
  onEnergyChange: (value: EnergyLevel) => void
  onPainKindChange: (value: PainKind) => void
  onNotesChange: (value: string) => void
  onSubmit: () => void
}

export function DailyCheckinForm({
  pain,
  sleep,
  energy,
  painKind,
  notes,
  error,
  errorTone = "error",
  pending,
  submitEnabled,
  offline = false,
  exercisesDone,
  exercisesTotal,
  onPainChange,
  onSleepChange,
  onEnergyChange,
  onPainKindChange,
  onNotesChange,
  onSubmit,
}: DailyCheckinFormProps) {
  const notesId = useId()

  return (
    <section className={surfaceCardClassName("flex w-full min-w-0 flex-col gap-6 p-5 sm:p-6 lg:p-7")}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-800 sm:text-xl dark:text-[var(--kf-text)]">
            Check-in zilnic
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">Spune-i terapeutului cum te simți azi.</p>
        </div>
      </div>

      <VasScale value={pain} onChange={onPainChange} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8">
        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Calitatea somnului</legend>
          <div className="grid grid-cols-3 gap-2">
            {SLEEP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onSleepChange(option.value)}
                className={cn(
                  "flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center",
                  sleep === option.value
                    ? "border-[#042f2e] bg-[#042f2e] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:text-[var(--kf-text)]",
                )}
              >
                <span className="text-2xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="text-xs font-semibold">{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex min-w-0 flex-col gap-3">
          <legend className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Tip durere</legend>
          <div className="grid grid-cols-3 gap-2">
            {PAIN_KIND_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={painKind === option.value}
                onClick={() => onPainKindChange(option.value)}
                className={cn(
                  "flex min-h-[4.75rem] items-center justify-center rounded-2xl border px-2 py-3 text-center",
                  painKind === option.value
                    ? "border-[#042f2e] bg-[#042f2e] text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:text-[var(--kf-text)]",
                )}
              >
                <span className="text-xs font-semibold leading-tight sm:text-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Nivel de energie</legend>
        <div className="grid grid-cols-5 gap-1.5">
          {ENERGY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={energy === option.value}
              onClick={() => onEnergyChange(option.value)}
              className={cn(
                "flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-2xl border px-1 py-2 text-center transition-colors",
                energy === option.value
                  ? "border-[#042f2e] bg-[#042f2e] text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:text-[var(--kf-text)]",
              )}
            >
              <span className="text-xl" aria-hidden="true">
                {option.emoji}
              </span>
              <span className="text-[11px] leading-tight font-semibold">{option.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex min-w-0 flex-col gap-2">
          <label htmlFor={notesId} className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">
            Cum te simți azi?
          </label>
          <Textarea
            id={notesId}
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Cum te simți azi?"
            className="min-h-[48px] rounded-xl border-slate-300"
            maxLength={280}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-2">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={pending || !submitEnabled}
            className="h-12 min-h-[48px] w-full rounded-2xl px-8 text-base font-semibold lg:w-auto lg:min-w-[14rem]"
          >
            {pending ? "Se trimite…" : offline ? "Trimite când ai internet" : "Trimite check-in-ul"}
          </Button>
          {!submitEnabled && exercisesTotal > 0 ? (
            <p className="text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">
              Bifează toate exercițiile de azi ({exercisesDone}/{exercisesTotal}) ca să deblochezi trimiterea.
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <p
          role="status"
          className={
            errorTone === "offline"
              ? "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
              : "rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
          }
        >
          {error}
        </p>
      ) : null}
    </section>
  )
}
