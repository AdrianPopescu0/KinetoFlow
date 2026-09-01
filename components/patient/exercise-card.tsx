"use client"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Checkbox } from "@/components/ui/checkbox"
import { formatRest } from "@/lib/patients/program"
import type { Exercise } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

type ExerciseCardProps = {
  exercise: Exercise
  completed: boolean
  locked: boolean
  onToggle: (exerciseId: string, completed: boolean) => void
}

export function ExerciseCard({ exercise, completed, locked, onToggle }: ExerciseCardProps) {
  const checkboxId = `exercise-${exercise.id}`

  return (
    <article
      className={cn(
        surfaceCardClassName("overflow-hidden"),
        completed && "border-teal-200 ring-1 ring-teal-100",
      )}
    >
      <div className="aspect-video overflow-hidden bg-slate-100">
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${exercise.youtubeId}?rel=0&modestbranding=1`}
          title={exercise.title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="h-full w-full"
        />
      </div>

      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">
            {exercise.category}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-800">
            {exercise.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-[#042f2e]">
            {exercise.sets} serii × {exercise.reps} repetări
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {formatRest(exercise.restSeconds)}
          </span>
        </div>

        <label
          htmlFor={checkboxId}
          className={cn(
            "flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium",
            completed
              ? "border-teal-200 bg-teal-50 text-slate-800"
              : "border-slate-200 bg-slate-50 text-slate-700",
            locked && "opacity-80",
          )}
        >
          <Checkbox
            id={checkboxId}
            checked={completed}
            disabled={locked}
            onCheckedChange={(value) => onToggle(exercise.id, value === true)}
            className="size-5 rounded-md border-slate-300 data-checked:border-[#042f2e] data-checked:bg-[#042f2e] data-checked:text-white"
          />
          Am terminat exercițiul
        </label>
      </div>
    </article>
  )
}
