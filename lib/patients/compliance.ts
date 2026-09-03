/** Procent de complianță pe 7 zile: check-in-uri față de sesiunile programate. */
export function sevenDayCompliancePercent(
  completedCheckIns: number,
  scheduledSessions: number,
): number {
  const completed = Number(completedCheckIns)
  const scheduled = Number(scheduledSessions)

  if (!Number.isFinite(scheduled) || scheduled <= 0) {
    return 0
  }
  if (!Number.isFinite(completed) || completed <= 0) {
    return 0
  }

  const percent = Math.round((completed / scheduled) * 100)
  if (!Number.isFinite(percent)) {
    return 0
  }
  return Math.max(0, Math.min(100, percent))
}

export function formatCompliancePercent(value: number): string {
  if (!Number.isFinite(value)) {
    return "0%"
  }
  return `${value}%`
}
