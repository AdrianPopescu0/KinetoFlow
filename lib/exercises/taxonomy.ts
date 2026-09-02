import type {
  AnatomicalRegion,
  Difficulty,
  Equipment,
  ExercisePosition,
} from "@/lib/exercises/types"

export type SubcategoryDef = {
  id: string
  label: string
}

export type RegionDef = {
  id: AnatomicalRegion
  label: string
  shortLabel: string
  subcategories: SubcategoryDef[]
}

export const REGIONS: RegionDef[] = [
  {
    id: "cervical",
    label: "Coloană Cervicală & Toracală",
    shortLabel: "Cervicală & Toracală",
    subcategories: [
      { id: "mobility-retraction", label: "Mobilitate & Retracție" },
      { id: "tone-posture", label: "Tonifiere & Stabilizare posturală" },
      { id: "stretch-relax", label: "Stretching & Relaxare" },
    ],
  },
  {
    id: "lumbar",
    label: "Coloană Lombară & Bazin",
    shortLabel: "Lombară & Bazin",
    subcategories: [
      { id: "core-control", label: "Control motor & Core (abdomen/spate)" },
      { id: "lumbopelvic-mob", label: "Mobilizare lombo-pelvină" },
      { id: "decompression", label: "Decompresie & Elongare" },
    ],
  },
  {
    id: "upper",
    label: "Membru Superior (Umăr, Cot, Pumn)",
    shortLabel: "Membru superior",
    subcategories: [
      { id: "rotator-cuff", label: "Coafa rotatorilor (Rotatori interni/externi)" },
      { id: "scapulo-humeral", label: "Mobilitate scapulo-humerală" },
      { id: "wrist-forearm", label: "Pumn & Antebraț (Epicondilite / Tendoane)" },
    ],
  },
  {
    id: "lower",
    label: "Membru Inferior (Șold, Genunchi, Gleznă)",
    shortLabel: "Membru inferior",
    subcategories: [
      { id: "knee-stability", label: "Stabilizare & Cadență genunchi" },
      { id: "hip-mobility", label: "Mobilitate & Forță șold" },
      { id: "ankle-proprio", label: "Propriocepție & Echilibru gleznă" },
    ],
  },
  {
    id: "functional",
    label: "Funcțional / Full-Body",
    shortLabel: "Funcțional",
    subcategories: [
      { id: "advanced-balance", label: "Echilibru & Propriocepție avansată" },
      { id: "gait-transfers", label: "Reeducarea mersului & Transferuri" },
      { id: "breathing", label: "Respirație & Relaxare" },
    ],
  },
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

export function subcategoryLabel(region: AnatomicalRegion, subcategoryId: string): string {
  return regionById(region).subcategories.find((item) => item.id === subcategoryId)?.label ?? subcategoryId
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
