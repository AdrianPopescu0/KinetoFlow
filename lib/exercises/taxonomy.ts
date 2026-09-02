import type {
  AnatomicalRegion,
  Difficulty,
  Equipment,
  ExercisePosition,
  TherapeuticObjective,
} from "@/lib/exercises/types"

export type SubcategoryDef = {
  id: TherapeuticObjective
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
    label: "Coloană Cervicală",
    shortLabel: "Cervicală",
    subcategories: [
      { id: "neck-mobility", label: "Mobilitate gât" },
      { id: "head-posture", label: "Postură cap & ceafă" },
      { id: "trap-stretch", label: "Întindere trapez" },
    ],
  },
  {
    id: "thoracic",
    label: "Coloană Toracală",
    shortLabel: "Toracală",
    subcategories: [
      { id: "chest-open", label: "Deschidere piept" },
      { id: "trunk-rotation", label: "Rotații trunchi" },
      { id: "midback-relax", label: "Relaxare spate mijloc" },
    ],
  },
  {
    id: "lumbar",
    label: "Coloană Lombară",
    shortLabel: "Lombară",
    subcategories: [
      { id: "lumbar-relax", label: "Relaxare / Decompresie" },
      { id: "core", label: "Abdomen & Spate (Core)" },
      { id: "lumbar-stretch", label: "Întindere lombară" },
    ],
  },
  {
    id: "pelvis",
    label: "Bazin & Pelvis",
    shortLabel: "Bazin & Pelvis",
    subcategories: [
      { id: "pelvic-tilt", label: "Basculare bazin" },
      { id: "glute-hip", label: "Fesieri & Șold" },
      { id: "pelvic-relax", label: "Relaxare bazin" },
    ],
  },
  {
    id: "upper",
    label: "Membru Superior",
    shortLabel: "Membru superior",
    subcategories: [
      { id: "shoulder", label: "Umăr" },
      { id: "elbow", label: "Cot" },
      { id: "wrist-fingers", label: "Pumn & Degete" },
    ],
  },
  {
    id: "lower",
    label: "Membru Inferior",
    shortLabel: "Membru inferior",
    subcategories: [
      { id: "hip", label: "Șold" },
      { id: "knee", label: "Genunchi" },
      { id: "ankle-heel", label: "Gleznă & Călcâi" },
    ],
  },
  {
    id: "functional",
    label: "Funcțional",
    shortLabel: "Funcțional",
    subcategories: [
      { id: "balance", label: "Echilibru" },
      { id: "gait", label: "Mers" },
      { id: "breathing", label: "Respirație" },
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
