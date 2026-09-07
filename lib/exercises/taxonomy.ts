import type {
  AnatomicalRegion,
  Difficulty,
  Equipment,
  ExercisePosition,
  TherapeuticObjective,
} from "./types.ts"

export type SubcategoryDef = {
  id: TherapeuticObjective
  label: string
}

export type RegionDef = {
  id: AnatomicalRegion
  label: string
  shortLabel: string
}

export const OBJECTIVES: SubcategoryDef[] = [
  { id: "mobility", label: "Mobilitate" },
  { id: "strength", label: "Forță" },
  { id: "stability", label: "Stabilitate" },
  { id: "stretching", label: "Stretching" },
  { id: "posture", label: "Postură" },
]

const LEGACY_OBJECTIVE_MAP: Record<string, TherapeuticObjective> = {
  "neck-mobility": "mobility",
  "head-posture": "posture",
  "trap-stretch": "stretching",
  "chest-open": "mobility",
  "trunk-rotation": "mobility",
  "midback-relax": "mobility",
  "lumbar-relax": "stretching",
  core: "stability",
  "lumbar-stretch": "mobility",
  "pelvic-tilt": "mobility",
  "glute-hip": "strength",
  "pelvic-relax": "stretching",
  shoulder: "strength",
  elbow: "stretching",
  "wrist-fingers": "strength",
  hip: "strength",
  knee: "strength",
  "ankle-heel": "mobility",
  balance: "stability",
  gait: "strength",
  breathing: "posture",
}

export const REGIONS: RegionDef[] = [
  { id: "cervical", label: "Coloană Cervicală", shortLabel: "Cervicală" },
  { id: "thoracic", label: "Coloană Toracală", shortLabel: "Toracală" },
  { id: "lumbar", label: "Coloană Lombară", shortLabel: "Lombară" },
  { id: "pelvis", label: "Bazin & Pelvis", shortLabel: "Bazin & Pelvis" },
  { id: "upper", label: "Membru Superior", shortLabel: "Membru superior" },
  { id: "lower", label: "Membru Inferior", shortLabel: "Membru inferior" },
  { id: "functional", label: "Funcțional", shortLabel: "Funcțional" },
]

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: "usor", label: "Ușor" },
  { id: "mediu", label: "Mediu" },
  { id: "avansat", label: "Avansat" },
]

export const EQUIPMENT: { id: Equipment; label: string }[] = [
  { id: "none", label: "Fără echipament" },
  { id: "bands", label: "Benzi elastice" },
  { id: "dumbbells", label: "Gantere" },
  { id: "ball", label: "Minge/BOSU" },
  { id: "roller", label: "Rulou/Spumă" },
]

export const POSITIONS: { id: ExercisePosition; label: string }[] = [
  { id: "lying", label: "Culcat (Decubit)" },
  { id: "sitting", label: "Șezând" },
  { id: "standing", label: "În picioare (Ortostatism)" },
]

export function regionById(id: AnatomicalRegion): RegionDef {
  return REGIONS.find((region) => region.id === id) ?? REGIONS[0]
}

export function isTherapeuticObjective(value: string): value is TherapeuticObjective {
  return OBJECTIVES.some((item) => item.id === value)
}

export function normalizeObjective(value: string | null | undefined): TherapeuticObjective {
  if (value && isTherapeuticObjective(value)) {
    return value
  }
  if (value && value in LEGACY_OBJECTIVE_MAP) {
    return LEGACY_OBJECTIVE_MAP[value]
  }
  return "mobility"
}

export function subcategoryLabel(_region: AnatomicalRegion | string, subcategoryId: string): string
export function subcategoryLabel(subcategoryId: string): string
export function subcategoryLabel(
  regionOrId: AnatomicalRegion | string,
  subcategoryId?: string,
): string {
  const id = subcategoryId ?? regionOrId
  return OBJECTIVES.find((item) => item.id === id)?.label ?? OBJECTIVES.find((item) => item.id === normalizeObjective(id))?.label ?? id
}

export function objectiveBelongsToRegion(
  _region: AnatomicalRegion,
  subcategory: string,
): boolean {
  return isTherapeuticObjective(subcategory) || subcategory in LEGACY_OBJECTIVE_MAP
}

export function assertCatalogMatchesTaxonomy(
  exercises: { region: AnatomicalRegion; subcategory: TherapeuticObjective }[],
): void {
  const counts: Record<AnatomicalRegion, number> = {
    cervical: 0,
    thoracic: 0,
    lumbar: 0,
    pelvis: 0,
    upper: 0,
    lower: 0,
    functional: 0,
  }

  for (const exercise of exercises) {
    if (!REGIONS.some((region) => region.id === exercise.region)) {
      throw new Error(`Catalog: regiune necunoscută "${exercise.region}"`)
    }
    if (!isTherapeuticObjective(exercise.subcategory)) {
      throw new Error(
        `Catalog: obiectiv necunoscut "${exercise.subcategory}" la regiunea "${exercise.region}"`,
      )
    }
    counts[exercise.region] += 1
  }

  for (const region of REGIONS) {
    if (counts[region.id] < 2) {
      throw new Error(`Catalog: regiunea "${region.id}" are mai puțin de 2 exerciții`)
    }
  }
}

export function difficultyLabel(id: Difficulty): string {
  return DIFFICULTIES.find((item) => item.id === id)?.label ?? id
}

export function equipmentLabel(id: Equipment): string {
  return EQUIPMENT.find((item) => item.id === id)?.label ?? id
}

export function positionLabel(id: ExercisePosition): string {
  return POSITIONS.find((item) => item.id === id)?.label ?? id
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}
