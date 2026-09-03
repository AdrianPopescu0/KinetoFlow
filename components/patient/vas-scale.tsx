"use client"

import { useId } from "react"

import {
  VAS_SCORES,
  vasBandLabel,
  vasDescription,
  vasPalette,
} from "@/lib/patients/vas"
import { cn } from "@/lib/utils"

type VasScaleProps = {
  value: number
  onChange: (value: number) => void
}

export function VasScale({ value, onChange }: VasScaleProps) {
  const labelId = useId()
  const palette = vasPalette(value)
  const description = vasDescription(value)
  const band = vasBandLabel(value)

  function move(delta: number) {
    onChange(Math.min(10, Math.max(0, value + delta)))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p id={labelId} className="text-sm font-semibold text-slate-800">
            Durere VAS 0–10
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Cât de intensă e durerea acum? Atinge un număr sau glisează.
          </p>
        </div>
      </div>

      <div role="radiogroup" aria-labelledby={labelId}>
        <div className="flex flex-wrap justify-center gap-2 sm:grid sm:grid-cols-11 sm:gap-2">
          {VAS_SCORES.map((score) => {
            const selected = score === value
            const tone = vasPalette(score)
            return (
              <button
                key={score}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Nivel ${score}, ${vasBandLabel(score)}`}
                onClick={() => onChange(score)}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                    event.preventDefault()
                    move(1)
                  }
                  if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                    event.preventDefault()
                    move(-1)
                  }
                  if (event.key === "Home") {
                    event.preventDefault()
                    onChange(0)
                  }
                  if (event.key === "End") {
                    event.preventDefault()
                    onChange(10)
                  }
                }}
                className={cn(
                  "inline-flex size-12 min-h-[44px] min-w-[44px] shrink-0 touch-manipulation items-center justify-center rounded-2xl text-base font-bold tabular-nums transition-[transform,box-shadow] duration-150",
                  "sm:h-12 sm:w-full sm:min-w-[44px] sm:size-auto",
                  selected ? "z-[1] scale-[1.06]" : "active:scale-95",
                )}
                style={
                  selected
                    ? {
                        backgroundColor: tone.hex,
                        color: tone.selectedText,
                        boxShadow: `0 0 0 3px #fff, 0 0 0 6px ${tone.hex}, 0 10px 22px ${tone.glow}`,
                      }
                    : {
                        backgroundColor: tone.idleBg,
                        color: tone.idleText,
                        boxShadow: `inset 0 0 0 2px ${tone.hex}`,
                      }
                }
              >
                {score}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={10}
          step={1}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-labelledby={labelId}
          aria-valuetext={`${value} din 10, ${band}`}
          className="vas-slider h-11 w-full cursor-pointer touch-manipulation appearance-none bg-transparent"
          style={{ ["--vas-thumb" as string]: palette.hex }}
        />
        <div className="flex justify-between text-[11px] font-medium text-slate-500">
          <span>0 · Fără durere</span>
          <span>10 · Durere maximă</span>
        </div>
      </div>

      <div
        className="rounded-2xl border px-4 py-4 sm:px-5"
        style={{
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
        }}
      >
        <div className="flex items-start gap-4">
          <div className="flex shrink-0 flex-col items-center leading-none">
            <p
              className="text-5xl font-semibold tabular-nums tracking-tight sm:text-6xl"
              style={{ color: palette.hex }}
              aria-live="polite"
            >
              {value}
            </p>
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">/ 10</p>
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-sm font-semibold" style={{ color: palette.hex }}>
              {band}
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{description}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
