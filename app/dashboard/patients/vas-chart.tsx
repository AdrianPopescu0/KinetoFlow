"use client"

import { useId, useMemo } from "react"

import type { VasCheckInPoint } from "@/lib/patients/vas-history"
import {
  buildVasDailySeries,
  formatVasChartDate,
  vasHistorySpansYears,
} from "@/lib/patients/vas-history"
import { cn } from "@/lib/utils"

function pointFill(score: number): string {
  if (score >= 7) {
    return "#dc2626"
  }
  if (score >= 4) {
    return "#d97706"
  }
  return "#059669"
}

export function VasChart({
  checkIns,
  compact = false,
}: {
  checkIns: VasCheckInPoint[]
  compact?: boolean
}) {
  const reactId = useId().replace(/:/g, "")
  const points = useMemo(() => buildVasDailySeries(checkIns), [checkIns])
  const includeYear = vasHistorySpansYears(points)

  if (points.length === 0) {
    return (
      <p className={cn("text-center text-sm text-slate-600", compact ? "px-3 py-6" : "px-5 py-8")}>
        Nu există încă check-in-uri pentru un grafic VAS.
      </p>
    )
  }

  const slot = compact ? 44 : 52
  const padLeft = 36
  const padRight = 18
  const padTop = 18
  const padBottom = 36
  const width = Math.max(compact ? 420 : 560, padLeft + padRight + Math.max(points.length - 1, 1) * slot)
  const height = compact ? 196 : 220
  const plotWidth = width - padLeft - padRight
  const plotHeight = height - padTop - padBottom
  const maxX = Math.max(points.length - 1, 1)
  const labelStep = points.length <= 12 ? 1 : Math.ceil(points.length / 10)

  const coords = points.map((point, index) => {
    const x = points.length === 1 ? padLeft + plotWidth / 2 : padLeft + (index / maxX) * plotWidth
    const y = padTop + ((10 - point.vasScore) / 10) * plotHeight
    return { ...point, x, y }
  })

  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ")
  const area = `${padLeft},${padTop + plotHeight} ${polyline} ${coords[coords.length - 1]?.x ?? padLeft},${padTop + plotHeight}`

  const yTicks = [0, 2, 4, 6, 8, 10]

  return (
    <div className={cn("overflow-x-auto", compact ? "px-1 py-2" : "px-4 py-4")}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cn("w-full min-w-[20rem]", compact ? "h-44" : "h-52")}
        role="img"
        aria-label={`Evoluție VAS pe ${points.length} zile de check-in`}
      >
        <defs>
          <linearGradient id={`vas-fill-${reactId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#042f2e" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#042f2e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = padTop + ((10 - tick) / 10) * plotHeight
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke={tick === 0 ? "#cbd5e1" : "#e2e8f0"}
                strokeDasharray={tick === 0 ? undefined : "3 4"}
              />
              <text x={padLeft - 8} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize="10">
                {tick}
              </text>
            </g>
          )
        })}

        <polygon fill={`url(#vas-fill-${reactId})`} points={area} />
        <polyline fill="none" stroke="#042f2e" strokeWidth="2.4" strokeLinejoin="round" points={polyline} />

        {coords.map((point, index) => {
          const showLabel = index === 0 || index === coords.length - 1 || index % labelStep === 0
          return (
            <g key={point.dateKey}>
              <circle cx={point.x} cy={point.y} r={compact ? 3.5 : 4.2} fill={pointFill(point.vasScore)}>
                <title>
                  {formatVasChartDate(point.dateKey, includeYear)} — VAS {point.vasScore}/10
                </title>
              </circle>
              {showLabel ? (
                <text
                  x={point.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-slate-500"
                  fontSize="10"
                >
                  {formatVasChartDate(point.dateKey, includeYear)}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
