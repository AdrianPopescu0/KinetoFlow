"use client"

import { useId } from "react"

import { glassCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  PAIN_KIND_OPTIONS,
  SLEEP_OPTIONS,
  painIntensityCopy,
} from "@/lib/patients/program"
import type { PainKind, SleepQuality } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

type DailyCheckinFormProps = {
  pain: number
  sleep: SleepQuality | null
  painKind: PainKind | null
  notes: string
  error: string | null
  pending: boolean
  onPainChange: (value: number) => void
  onSleepChange: (value: SleepQuality) => void
  onPainKindChange: (value: PainKind) => void
  onNotesChange: (value: string) => void
  onSubmit: () => void
}

const TONE_CLASS = {
  green: "text-emerald-400",
  orange: "text-amber-400",
  red: "text-rose-400",
} as const

const TONE_TRACK = {
  green: "#10b981",
  orange: "#f59e0b",
  red: "#f43f5e",
} as const

export function DailyCheckinForm({
  pain,
  sleep,
  painKind,
  notes,
  error,
  pending,
  onPainChange,
  onSleepChange,
  onPainKindChange,
  onNotesChange,
  onSubmit,
}: DailyCheckinFormProps) {
  const sliderId = useId()
  const notesId = useId()
  const intensity = painIntensityCopy(pain)
  const trackColor = TONE_TRACK[intensity.tone]
  const fillPercent = (pain / 10) * 100

  return (
    <section className={glassCardClassName("flex flex-col gap-6 p-4 sm:p-5")}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white">Check-in zilnic</h2>
        <p className="mt-1 text-sm text-emerald-100/70">
          Durează sub 30 de secunde. Terapeutul vede răspunsul azi.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <label htmlFor={sliderId} className="text-sm font-semibold text-white">
            Nivel durere (VAS 0–10)
          </label>
          <span
            className={cn("text-2xl font-semibold tabular-nums", TONE_CLASS[intensity.tone])}
            aria-live="polite"
          >
            {pain}
          </span>
        </div>

        <input
          id={sliderId}
          type="range"
          min={0}
          max={10}
          step={1}
          value={pain}
          onChange={(event) => onPainChange(Number(event.target.value))}
          className="kf-vas"
          style={{
            color: trackColor,
            background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${fillPercent}%, rgb(255 255 255 / 0.12) ${fillPercent}%, rgb(255 255 255 / 0.12) 100%)`,
          }}
          aria-valuemin={0}
          aria-valuemax={10}
          aria-valuenow={pain}
          aria-valuetext={`${pain} din 10, ${intensity.label}`}
        />

        <div className="flex justify-between text-[11px] font-medium tracking-wide text-slate-400 uppercase">
          <span>0</span>
          <span>10</span>
        </div>
        <p className={cn("text-center text-sm font-medium", TONE_CLASS[intensity.tone])}>
          {intensity.label}
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-white">Calitatea somnului</legend>
        <div className="grid grid-cols-3 gap-2">
          {SLEEP_OPTIONS.map((option) => {
            const selected = sleep === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSleepChange(option.value)}
                className={cn(
                  "flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center backdrop-blur-md transition-colors",
                  selected
                    ? "border-emerald-400/40 bg-emerald-500 text-emerald-950 shadow-sm"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-teal-400/40",
                )}
                aria-pressed={selected}
              >
                <span className="text-2xl" aria-hidden="true">
                  {option.emoji}
                </span>
                <span className="text-xs font-semibold">{option.label}</span>
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-white">Tipul durerii resimțite azi</legend>
        <div className="flex flex-wrap gap-2">
          {PAIN_KIND_OPTIONS.map((option) => {
            const selected = painKind === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onPainKindChange(option.value)}
                className={cn(
                  "min-h-[48px] rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                  selected
                    ? "border-emerald-400/40 bg-emerald-500 text-emerald-950"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-teal-400/40",
                )}
                aria-pressed={selected}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor={notesId} className="text-sm font-semibold text-white">
          Observații <span className="font-normal text-emerald-100/50">(opțional)</span>
        </label>
        <Textarea
          id={notesId}
          rows={1}
          value={notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Alte mențiuni pentru terapeut (opțional)..."
          className="min-h-[48px] field-sizing-content resize-none rounded-xl px-3 py-2.5 text-base"
          maxLength={280}
        />
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-100" role="alert">
          {error}
        </p>
      ) : null}

      <Button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="h-14 min-h-[48px] w-full rounded-2xl bg-emerald-500 text-base font-semibold text-emerald-950 hover:bg-emerald-400"
      >
        {pending ? "Se trimite…" : "Trimite evaluarea de azi"}
      </Button>
    </section>
  )
}
