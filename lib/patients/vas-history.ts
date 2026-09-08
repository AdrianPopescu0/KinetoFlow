import { bucharestDateKey } from "../time/bucharest.ts"

export type VasCheckInPoint = {
  vas_score: number
  created_at: string
}

export type VasDailyPoint = {
  dateKey: string
  vasScore: number
  createdAt: string
}

/** Un punct pe zi calendaristică București — ultimul check-in din acea zi. */
export function buildVasDailySeries(checkIns: VasCheckInPoint[]): VasDailyPoint[] {
  const byDay = new Map<string, VasDailyPoint>()

  for (const row of checkIns) {
    if (typeof row.vas_score !== "number" || !Number.isFinite(row.vas_score)) {
      continue
    }
    const dateKey = bucharestDateKey(row.created_at)
    if (!dateKey) {
      continue
    }
    const current = byDay.get(dateKey)
    if (!current || row.created_at > current.createdAt) {
      byDay.set(dateKey, {
        dateKey,
        vasScore: row.vas_score,
        createdAt: row.created_at,
      })
    }
  }

  return [...byDay.values()].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
}

export function formatVasChartDate(dateKey: string, includeYear = false): string {
  const [year, month, day] = dateKey.split("-")
  if (!year || !month || !day) {
    return dateKey
  }
  const label = `${Number(day)}.${month}`
  return includeYear ? `${label}.${year.slice(-2)}` : label
}

export function vasHistorySpansYears(points: VasDailyPoint[]): boolean {
  if (points.length === 0) {
    return false
  }
  const firstYear = points[0]?.dateKey.slice(0, 4)
  return points.some((point) => point.dateKey.slice(0, 4) !== firstYear)
}

export function isHighPainVas(score: number | null | undefined): boolean {
  return (score ?? 0) >= 7
}
