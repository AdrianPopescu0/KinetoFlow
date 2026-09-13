import {
  isEnergyLevel,
  isPainKind,
  isSleepQuality,
  type EnergyLevel,
  type PainKind,
  type SleepQuality,
} from "./types.ts"

export type CheckinDraft = {
  pain: number
  sleep: SleepQuality | null
  energy: EnergyLevel | null
  painKind: PainKind | null
  notes: string
}

export function parseCheckinDraft(value: unknown): CheckinDraft | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const record = value as Record<string, unknown>
  if (typeof record.pain !== "number" || !Number.isInteger(record.pain) || record.pain < 0 || record.pain > 10) {
    return null
  }
  const sleep = record.sleep === null || record.sleep === undefined ? null : String(record.sleep)
  const energy = record.energy === null || record.energy === undefined ? null : String(record.energy)
  const painKind = record.painKind === null || record.painKind === undefined ? null : String(record.painKind)
  if (sleep !== null && !isSleepQuality(sleep)) {
    return null
  }
  if (energy !== null && !isEnergyLevel(energy)) {
    return null
  }
  if (painKind !== null && !isPainKind(painKind)) {
    return null
  }
  return {
    pain: record.pain,
    sleep,
    energy,
    painKind,
    notes: typeof record.notes === "string" ? record.notes : "",
  }
}
