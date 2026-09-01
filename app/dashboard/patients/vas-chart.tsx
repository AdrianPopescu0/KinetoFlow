import type { CheckInRecord } from "@/lib/patients/types-db"

export function VasChart({ checkIns }: { checkIns: CheckInRecord[] }) {
  const points = [...checkIns].reverse().slice(-14)

  if (points.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate-600">
        Nu există încă check-in-uri pentru un grafic VAS.
      </p>
    )
  }

  const width = 560
  const height = 180
  const pad = 24
  const maxX = Math.max(points.length - 1, 1)

  const coords = points.map((point, index) => {
    const x = pad + (index / maxX) * (width - pad * 2)
    const y = pad + ((10 - point.vas_score) / 10) * (height - pad * 2)
    return { x, y, score: point.vas_score }
  })

  const polyline = coords.map((point) => `${point.x},${point.y}`).join(" ")

  return (
    <div className="overflow-x-auto px-4 py-4">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-48 w-full min-w-[20rem]" role="img" aria-label="Evoluție VAS">
        <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="#cbd5e1" />
        <line x1={pad} y1={pad} x2={pad} y2={height - pad} stroke="#cbd5e1" />
        <polyline fill="none" stroke="#042f2e" strokeWidth="2.5" points={polyline} />
        {coords.map((point, index) => (
          <g key={`${point.x}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill={point.score >= 7 ? "#dc2626" : point.score >= 4 ? "#d97706" : "#059669"} />
          </g>
        ))}
      </svg>
    </div>
  )
}
