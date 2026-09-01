"use client"

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
        "overflow-hidden rounded-2xl border bg-white shadow-sm transition-colors",
        completed ? "border-[#005F73]/40 ring-1 ring-[#005F73]/15" : "border-slate-200/80",
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
          <p className="text-xs font-semibold tracking-wide text-[#005F73] uppercase">
            {exercise.category}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-[#0F4C5C]">
            {exercise.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-[#0F4C5C]/8 px-2.5 py-1 text-xs font-medium text-[#0F4C5C]">
            {exercise.sets} serii × {exercise.reps} repetări
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {formatRest(exercise.restSeconds)}
          </span>
        </div>

        <label
          htmlFor={checkboxId}
          className={cn(
            "flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium",
            completed
              ? "border-[#005F73]/30 bg-[#005F73]/8 text-[#0F4C5C]"
              : "border-slate-200 bg-slate-50 text-slate-700",
            locked && "opacity-80",
          )}
        >
          <Checkbox
            id={checkboxId}
            checked={completed}
            disabled={locked}
            onCheckedChange={(value) => onToggle(exercise.id, value === true)}
            className="size-5 rounded-md border-[#005F73]/40 data-checked:border-[#005F73] data-checked:bg-[#005F73]"
          />
          Am terminat exercițiul
        </label>
      </div>
    </article>
  )
}
