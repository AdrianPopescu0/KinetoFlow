"use client"

import { glassCardClassName } from "@/components/brand/app-atmosphere"
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
        glassCardClassName("overflow-hidden"),
        completed && "border-emerald-400/35 ring-1 ring-emerald-400/20",
      )}
    >
      <div className="aspect-video overflow-hidden rounded-t-2xl bg-slate-900/60">
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
          <p className="text-xs font-semibold tracking-wide text-teal-300 uppercase">
            {exercise.category}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-white">
            {exercise.title}
          </h3>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-100">
            {exercise.sets} serii × {exercise.reps} repetări
          </span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-slate-300">
            {formatRest(exercise.restSeconds)}
          </span>
        </div>

        <label
          htmlFor={checkboxId}
          className={cn(
            "flex min-h-[48px] items-center gap-3 rounded-xl border px-3 py-2 text-sm font-medium",
            completed
              ? "border-emerald-400/30 bg-emerald-500/15 text-white"
              : "border-white/10 bg-white/5 text-slate-300",
            locked && "opacity-80",
          )}
        >
          <Checkbox
            id={checkboxId}
            checked={completed}
            disabled={locked}
            onCheckedChange={(value) => onToggle(exercise.id, value === true)}
            className="size-5 rounded-md border-white/25 data-checked:border-emerald-500 data-checked:bg-emerald-500 data-checked:text-emerald-950"
          />
          Am terminat exercițiul
        </label>
      </div>
    </article>
  )
}
