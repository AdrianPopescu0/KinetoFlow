"use client"

import { Play } from "lucide-react"

import {
  difficultyLabel,
  equipmentLabel,
  formatDuration,
  regionById,
  subcategoryLabel,
} from "@/lib/exercises/taxonomy"
import type { LibraryExercise } from "@/lib/exercises/types"
import { youtubeThumbnailUrl } from "@/lib/patients/youtube"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const DIFFICULTY_CLASS = {
  usor: "bg-emerald-50 text-emerald-800",
  mediu: "bg-amber-50 text-amber-900",
  avansat: "bg-rose-50 text-rose-800",
} as const

export function LibraryCard({
  exercise,
  onPreview,
  onAssign,
}: {
  exercise: LibraryExercise
  onPreview: () => void
  onAssign: () => void
}) {
  const thumb = youtubeThumbnailUrl(exercise.youtubeId)
  const region = regionById(exercise.region)

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onPreview}
        className="group relative aspect-video overflow-hidden bg-slate-100"
        aria-label={`Preview video: ${exercise.title}`}
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">Fără thumbnail</div>
        )}
        <span className="absolute right-2 top-2 rounded-md bg-slate-900/75 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-white">
          {formatDuration(exercise.durationSeconds)}
        </span>
        <span className="absolute inset-0 flex items-center justify-center bg-slate-900/0 transition group-hover:bg-slate-900/35">
          <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-[#042f2e] opacity-0 shadow-sm transition group-hover:opacity-100">
            <Play className="size-5 fill-current" />
          </span>
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{exercise.title}</h2>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{exercise.description}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">
            {region.shortLabel}
          </span>
          <span className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600">
            {subcategoryLabel(exercise.region, exercise.subcategory)}
          </span>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", DIFFICULTY_CLASS[exercise.difficulty])}>
            {difficultyLabel(exercise.difficulty)}
          </span>
        </div>
        <dl className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 px-3 py-2 text-center text-xs text-slate-600">
          <div>
            <dt className="text-slate-400">Seturi</dt>
            <dd className="font-semibold text-slate-800">{exercise.sets}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Repetări</dt>
            <dd className="font-semibold text-slate-800">{exercise.reps}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Echipament</dt>
            <dd className="font-semibold text-slate-800">{equipmentLabel(exercise.equipment)}</dd>
          </div>
        </dl>
        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Button type="button" variant="outline" onClick={onPreview} className="h-11 flex-1 rounded-xl">
            Vezi detalii
          </Button>
          <Button type="button" onClick={onAssign} className="h-11 flex-1 rounded-xl">
            + Asignează
          </Button>
        </div>
      </div>
    </article>
  )
}
