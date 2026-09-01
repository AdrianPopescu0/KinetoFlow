"use client"

import { useId } from "react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SLEEP_OPTIONS, painIntensityCopy } from "@/lib/patients/program"
import type { SleepQuality } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

type DailyCheckinFormProps = {
  pain: number
  sleep: SleepQuality | null
  notes: string
  error: string | null
  pending: boolean
  onPainChange: (value: number) => void
  onSleepChange: (value: SleepQuality) => void
  onNotesChange: (value: string) => void
  onSubmit: () => void
}

const TONE_CLASS = {
  green: "text-emerald-700",
  orange: "text-amber-700",
  red: "text-red-700",
} as const

const TONE_TRACK = {
  green: "#059669",
  orange: "#d97706",
  red: "#dc2626",
} as const

function vasFace(pain: number): string {
  if (pain <= 3) {
    return "😊"
  }
  if (pain <= 6) {
    return "😐"
  }
  return "😫"
}

export function DailyCheckinForm({
  pain,
  sleep,
  notes,
  error,
  pending,
  onPainChange,
  onSleepChange,
  onNotesChange,
  onSubmit,
}: DailyCheckinFormProps) {
  const sliderId = useId()
  const notesId = useId()
  const intensity = painIntensityCopy(pain)
  const trackColor = TONE_TRACK[intensity.tone]
  const fillPercent = (pain / 10) * 100

  return (
    <section className={surfaceCardClassName("flex flex-col gap-6 p-4 sm:p-5")}>
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-800">Check-in zilnic</h2>
        <p className="mt-1 text-sm text-slate-600">Spune-i terapeutului cum te simți azi.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <label htmlFor={sliderId} className="text-sm font-semibold text-slate-800">
            Durere VAS 0–10
          </label>
          <span className={cn("text-2xl font-semibold tabular-nums", TONE_CLASS[intensity.tone])}>
            {vasFace(pain)} {pain}
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
            background: `linear-gradient(to right, ${trackColor} 0%, ${trackColor} ${fillPercent}%, #e2e8f0 ${fillPercent}%, #e2e8f0 100%)`,
          }}
        />
        <p className={cn("text-center text-sm font-medium", TONE_CLASS[intensity.tone])}>
          {intensity.label}
        </p>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-sm font-semibold text-slate-800">Calitatea somnului</legend>
        <div className="grid grid-cols-3 gap-2">
          {SLEEP_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSleepChange(option.value)}
              className={cn(
                "flex min-h-[5.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center",
                sleep === option.value
                  ? "border-[#042f2e] bg-[#042f2e] text-white"
                  : "border-slate-200 bg-slate-50 text-slate-700",
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

      <div className="flex flex-col gap-2">
        <label htmlFor={notesId} className="text-sm font-semibold text-slate-800">
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

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>
      ) : null}

      <Button
        type="button"
        onClick={onSubmit}
        disabled={pending}
        className="h-14 min-h-[48px] w-full rounded-2xl text-base font-semibold"
      >
        {pending ? "Se trimite…" : "Trimite check-in-ul"}
      </Button>
    </section>
  )
}
