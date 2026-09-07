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
]

const LEGACY_REGION_MAP: Record<string, AnatomicalRegion> = {
  functional: "lower",
  funcțional: "lower",
}

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
  { id: "standing", label: "În picioare (Ortostatism)" },
  { id: "sitting", label: "Așezat (Șezând)" },
  { id: "lying", label: "Culcat (Dorsal / Ventral / Lateral)" },
  { id: "kneeling", label: "Pe genunchi" },
  { id: "hanging", label: "Atârnat" },
]

const LEGACY_POSITION_MAP: Record<string, ExercisePosition> = {
  decubit: "lying",
  "decubit-dorsal": "lying",
  "decubit-ventral": "lying",
  "decubit-lateral": "lying",
  sezand: "sitting",
  "șezând": "sitting",
  asezat: "sitting",
  "așezat": "sitting",
  ortostatism: "standing",
  quadruped: "kneeling",
  patrupedie: "kneeling",
  "pe-genunchi": "kneeling",
  genunchi: "kneeling",
  atarnat: "hanging",
  "atârnat": "hanging",
  suspensie: "hanging",
}

export function isAnatomicalRegion(value: string): value is AnatomicalRegion {
  return REGIONS.some((region) => region.id === value)
}

export function normalizeRegion(value: string | null | undefined): AnatomicalRegion {
  if (value && isAnatomicalRegion(value)) {
    return value
  }
  if (value && value in LEGACY_REGION_MAP) {
    return LEGACY_REGION_MAP[value]
  }
  return "lumbar"
}

export function regionById(id: AnatomicalRegion | string): RegionDef {
  return REGIONS.find((region) => region.id === normalizeRegion(id)) ?? REGIONS[0]
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

export function isEquipment(value: string): value is Equipment {
  return EQUIPMENT.some((item) => item.id === value)
}

export function normalizeEquipment(value: string | null | undefined): Equipment {
  return value && isEquipment(value) ? value : "none"
}

export function equipmentLabel(id: Equipment | string): string {
  return EQUIPMENT.find((item) => item.id === id)?.label ?? id
}

export function equipmentLabels(ids: Array<Equipment | string>): string {
  return ids.map((id) => equipmentLabel(id)).join(" · ")
}

export function regionLabels(ids: Array<AnatomicalRegion | string>): string {
  return ids.map((id) => regionById(id).label).join(" · ")
}

export function objectiveLabels(ids: Array<TherapeuticObjective | string>): string {
  return ids.map((id) => subcategoryLabel(id)).join(" · ")
}

export function isExercisePosition(value: string): value is ExercisePosition {
  return POSITIONS.some((item) => item.id === value)
}

export function normalizePosition(value: string | null | undefined): ExercisePosition {
  if (value && isExercisePosition(value)) {
    return value
  }
  if (value && value in LEGACY_POSITION_MAP) {
    return LEGACY_POSITION_MAP[value]
  }
  return "sitting"
}

export function positionLabel(id: ExercisePosition | string): string {
  const normalized = normalizePosition(id)
  return POSITIONS.find((item) => item.id === normalized)?.label ?? id
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds))
  const minutes = Math.floor(safe / 60)
  const rest = safe % 60
  return `${minutes}:${rest.toString().padStart(2, "0")}`
}
