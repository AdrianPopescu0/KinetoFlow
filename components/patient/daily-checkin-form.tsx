"use client"

import { useId } from "react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { VasScale } from "@/components/patient/vas-scale"
import { ENERGY_OPTIONS, PAIN_KIND_OPTIONS, SLEEP_OPTIONS } from "@/lib/patients/program"
import type { EnergyLevel, PainKind, SleepQuality } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

/** 5 opțiuni: 3 pe rând pe telefon (3+2), 5 aliniate de la tabletă. */
const CHOICE_GRID_FIVE = "grid auto-rows-fr grid-cols-3 gap-3 md:grid-cols-5"
/** 6 opțiuni: mereu 3 pe rând pe ecrane mici, 6 pe un rând de la tabletă. */
const CHOICE_GRID_SIX = "grid auto-rows-fr grid-cols-3 gap-3 md:grid-cols-6"

function ChoiceButton({
  selected,
  emoji,
  label,
  onClick,
}: {
  selected: boolean
  emoji?: string
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "flex h-full min-h-[5.75rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center transition-colors",
        selected
          ? "border-[#042f2e] bg-[#042f2e] text-white"
          : "border-slate-200 bg-slate-50 text-slate-700 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:text-[var(--kf-text)]",
      )}
    >
      <span className="flex h-6 items-center justify-center text-xl leading-none" aria-hidden="true">
        {emoji ?? ""}
      </span>
      <span className="text-[11px] leading-tight font-semibold">{label}</span>
    </button>
  )
}

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

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Calitatea somnului</legend>
        <div className={CHOICE_GRID_FIVE}>
          {SLEEP_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={sleep === option.value}
              emoji={option.emoji}
              label={option.label}
              onClick={() => onSleepChange(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Tip durere</legend>
        <div className={CHOICE_GRID_SIX}>
          {PAIN_KIND_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={painKind === option.value}
              label={option.label}
              onClick={() => onPainKindChange(option.value)}
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">Nivel de energie</legend>
        <div className={CHOICE_GRID_FIVE}>
          {ENERGY_OPTIONS.map((option) => (
            <ChoiceButton
              key={option.value}
              selected={energy === option.value}
              emoji={option.emoji}
              label={option.label}
              onClick={() => onEnergyChange(option.value)}
            />
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
