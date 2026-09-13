/** Seturi / repetări: 0–99. Textul gol rămâne gol în input și devine 0 la conversie. */

export const DOSE_COUNT_MIN = 0
export const DOSE_COUNT_MAX = 99

export function parseDoseCount(raw: string): number {
  const trimmed = raw.trim()
  if (trimmed === "") {
    return 0
  }
  const parsed = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(parsed) || parsed < DOSE_COUNT_MIN) {
    return 0
  }
  return Math.min(DOSE_COUNT_MAX, parsed)
}

/** Păstrează ștergerea completă; doar cifre, plafonate la 99. */
export function sanitizeDoseCountInput(raw: string): string {
  if (raw === "") {
    return ""
  }
  const digits = raw.replace(/\D/g, "")
  if (digits === "") {
    return ""
  }
  return String(parseDoseCount(digits))
}

export function doseCountDraft(value: number | null | undefined, fallback = 0): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(parseDoseCount(String(value)))
  }
  return String(parseDoseCount(String(fallback)))
}
