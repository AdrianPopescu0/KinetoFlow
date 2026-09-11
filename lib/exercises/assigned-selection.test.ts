import assert from "node:assert/strict"
import { test } from "node:test"

import {
  assignedExerciseMatchesInterval,
  librarySelectionForAssignedInterval,
  preferredTreatmentInterval,
} from "./assigned-selection.ts"
import { composeIntervalExerciseNotes } from "./schedule.ts"
import type { LibraryExercise } from "./types.ts"

function libraryItem(partial: Pick<LibraryExercise, "id" | "title"> & Partial<LibraryExercise>): LibraryExercise {
  return {
    description: "",
    region: "lumbar",
    regions: ["lumbar"],
    subcategory: "mobility",
    objectives: ["mobility"],
    difficulty: "usor",
    equipment: "none",
    equipments: ["none"],
    position: "lying",
    sets: 3,
    reps: 10,
    durationSeconds: 60,
    youtubeId: null,
    videoUrl: null,
    ...partial,
  }
}

test("intervalul preferat e cel care acoperă ziua de azi", () => {
  const assigned = [
    { title: "A", notes: composeIntervalExerciseNotes("", "2026-09-01", "2026-09-07") },
    { title: "B", notes: composeIntervalExerciseNotes("", "2026-09-08", "2026-09-14") },
  ]
  assert.deepEqual(
    preferredTreatmentInterval(assigned, { startDate: "2026-09-11", endDate: "2026-09-17" }, "2026-09-11"),
    { startDate: "2026-09-08", endDate: "2026-09-14" },
  )
})

test("fără perioadă salvată rămâne intervalul implicit", () => {
  assert.deepEqual(
    preferredTreatmentInterval([{ title: "A", notes: "doar note" }], { startDate: "2026-09-11", endDate: "2026-09-17" }, "2026-09-11"),
    { startDate: "2026-09-11", endDate: "2026-09-17" },
  )
})

test("checkbox-urile și dozele se iau din programul deja alocat pe interval", () => {
  const catalog = [
    libraryItem({ id: "chin-tuck", title: "Retracție cervicală (Chin Tuck)", sets: 3, reps: 10 }),
    libraryItem({ id: "bridge", title: "Punte fesieri", sets: 3, reps: 12, videoUrl: "https://youtu.be/bridge" }),
    libraryItem({ id: "unused", title: "Extensie toracală", sets: 2, reps: 8 }),
  ]
  const interval = { startDate: "2026-09-08", endDate: "2026-09-14" }
  const assigned = [
    {
      title: "Retracție cervicală (Chin Tuck)",
      sets: 4,
      reps: 6,
      notes: composeIntervalExerciseNotes("mobilizare", interval.startDate, interval.endDate),
    },
    {
      title: "Punte fesieri",
      video_url: "https://youtu.be/bridge",
      sets: 5,
      reps: 8,
      notes: composeIntervalExerciseNotes("", interval.startDate, interval.endDate),
    },
    {
      title: "Extensie toracală",
      sets: 9,
      reps: 9,
      notes: composeIntervalExerciseNotes("", "2026-08-01", "2026-08-07"),
    },
  ]

  assert.equal(assignedExerciseMatchesInterval(assigned[0]!.notes, interval), true)
  assert.deepEqual(librarySelectionForAssignedInterval(catalog, assigned, interval), {
    selectedIds: ["chin-tuck", "bridge"],
    doses: {
      "chin-tuck": { sets: 4, reps: 6 },
      bridge: { sets: 5, reps: 8 },
    },
  })
})
