import { parseTagList, uniqueTags } from "./tags.ts"
import {
  normalizeEquipment,
  normalizeObjective,
  normalizeRegion,
} from "./taxonomy.ts"
import type {
  AnatomicalRegion,
  Equipment,
  LibraryExercise,
  TherapeuticObjective,
} from "./types.ts"

export type LibraryExerciseDraft = Omit<
  LibraryExercise,
  "regions" | "objectives" | "equipments" | "region" | "subcategory" | "equipment"
> & {
  region?: AnatomicalRegion | string | string[] | null
  regions?: Array<AnatomicalRegion | string> | string | null
  subcategory?: TherapeuticObjective | string | string[] | null
  objectives?: Array<TherapeuticObjective | string> | string | null
  equipment?: Equipment | string | string[] | null
  equipments?: Array<Equipment | string> | string | null
}

function firstOr<T>(values: T[], fallback: T): T {
  return values[0] ?? fallback
}

export function hydrateLibraryExercise(draft: LibraryExerciseDraft): LibraryExercise {
  const regions = uniqueTags([...parseTagList(draft.regions), ...parseTagList(draft.region)]).map(normalizeRegion)
  const objectives = uniqueTags([...parseTagList(draft.objectives), ...parseTagList(draft.subcategory)]).map(
    normalizeObjective,
  )
  const equipments = uniqueTags([...parseTagList(draft.equipments), ...parseTagList(draft.equipment)]).map(
    normalizeEquipment,
  )

  const safeRegions = regions.length > 0 ? regions : (["lumbar"] satisfies AnatomicalRegion[])
  const safeObjectives = objectives.length > 0 ? objectives : (["mobility"] satisfies TherapeuticObjective[])
  let safeEquipments = equipments.length > 0 ? equipments : (["none"] satisfies Equipment[])
  if (safeEquipments.length > 1) {
    safeEquipments = safeEquipments.filter((item) => item !== "none")
  }

  return {
    id: draft.id,
    title: draft.title,
    description: draft.description,
    region: firstOr(safeRegions, "lumbar"),
    regions: safeRegions,
    subcategory: firstOr(safeObjectives, "mobility"),
    objectives: safeObjectives,
    difficulty: draft.difficulty,
    equipment: firstOr(safeEquipments, "none"),
    equipments: safeEquipments,
    position: draft.position,
    sets: draft.sets,
    reps: draft.reps,
    durationSeconds: draft.durationSeconds,
    youtubeId: draft.youtubeId,
    videoUrl: draft.videoUrl,
    custom: draft.custom,
  }
}

export function hydrateLibraryExercises(drafts: LibraryExerciseDraft[]): LibraryExercise[] {
  return drafts.map(hydrateLibraryExercise)
}
