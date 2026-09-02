"use client"

import { useId, useRef } from "react"

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

const CHROMATIC_TRACK =
  "linear-gradient(90deg, #10b981 0%, #84cc16 18%, #eab308 40%, #f59e0b 52%, #f97316 68%, #ef4444 84%, #991b1b 100%)"

export function VasScale({ value, onChange }: VasScaleProps) {
  const labelId = useId()
  const trackRef = useRef<HTMLDivElement>(null)
  const palette = vasPalette(value)
  const description = vasDescription(value)
  const band = vasBandLabel(value)

  function setFromClientX(clientX: number) {
    const track = trackRef.current
    if (!track) {
      return
    }
    const rect = track.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    const next = Math.round(Math.min(1, Math.max(0, ratio)) * 10)
    onChange(next)
  }

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
          <p className="mt-0.5 text-xs text-slate-500">Cât de intensă e durerea acum?</p>
        </div>
        <p className="hidden text-[11px] font-medium uppercase tracking-wide text-slate-400 sm:block">
          Alege un nivel
        </p>
      </div>

      <div
        ref={trackRef}
        className="relative flex h-11 cursor-pointer touch-none items-center select-none"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId)
          setFromClientX(event.clientX)
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            setFromClientX(event.clientX)
          }
        }}
      >
        <div
          className="h-2.5 w-full rounded-full shadow-inner"
          style={{ background: CHROMATIC_TRACK }}
        />
        {VAS_SCORES.map((score) => (
          <span
            key={score}
            className="pointer-events-none absolute top-1/2 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80 ring-1 ring-black/10"
            style={{ left: `${(score / 10) * 100}%` }}
          />
        ))}
        <span
          className="pointer-events-none absolute top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white transition-[left,background-color,box-shadow] duration-150"
          style={{
            left: `${(value / 10) * 100}%`,
            backgroundColor: palette.hex,
            boxShadow: `0 0 0 2px ${palette.hex}, 0 8px 18px ${palette.glow}`,
          }}
        />
      </div>
      <div className="flex justify-between text-[11px] font-medium text-slate-400">
        <span>Fără durere</span>
        <span>Durere maximă</span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-valuetext={`${value} din 10, ${band}. ${description}`}
        className="overflow-visible"
      >
        <div className="flex flex-wrap justify-center gap-1.5 py-0.5 sm:grid sm:grid-cols-11 sm:gap-1.5">
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
                  "flex aspect-square min-h-10 w-[calc((100%-0.375rem*5)/6)] min-w-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums transition-[transform,box-shadow,background-color,color] duration-200 sm:h-auto sm:min-h-11 sm:w-full",
                  selected ? "z-[1] scale-105" : "active:scale-95 sm:hover:scale-[1.04]",
                )}
                style={
                  selected
                    ? {
                        backgroundColor: tone.hex,
                        color: tone.selectedText,
                        boxShadow: `0 0 0 2px ${tone.hex}, 0 0 20px ${tone.glow}`,
                      }
                    : {
                        backgroundColor: tone.idleBg,
                        color: tone.idleText,
                        boxShadow: `inset 0 0 0 1px ${tone.cardBorder}`,
                      }
                }
              >
                {score}
              </button>
            )
          })}
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
            <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-slate-400">
              / 10
            </p>
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
