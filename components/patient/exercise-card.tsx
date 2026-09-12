"use client"

import { memo } from "react"

import { VideoPreview } from "@/components/media/video-preview"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import type { Exercise } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

type ExerciseCardProps = {
  exercise: Exercise
  completed: boolean
  pending?: boolean
  onToggle: (exerciseId: string, completed: boolean) => void
  onSessionStart?: () => void
}

export const ExerciseCard = memo(function ExerciseCard({
  exercise,
  completed,
  pending = false,
  onToggle,
  onSessionStart,
}: ExerciseCardProps) {
  const src = exercise.videoUrl ?? (exercise.youtubeId ? `https://www.youtube.com/watch?v=${exercise.youtubeId}` : null)

  const locked = completed
  const controlsDisabled = pending || locked

  function markCompleted() {
    if (controlsDisabled) {
      return
    }
    onSessionStart?.()
    onToggle(exercise.id, true)
  }

  return (
    <article
      className={cn(
        surfaceCardClassName("flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden"),
        completed && "border-teal-200 ring-1 ring-teal-100",
      )}
    >
      <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-slate-100">
        <VideoPreview url={src} title={exercise.title} fill onStart={onSessionStart} />
      </div>

      <div className="flex min-h-[12rem] flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-wide text-[#042f2e] uppercase">
            {exercise.category}
          </p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.75rem] text-base font-semibold tracking-tight text-slate-800">
            {exercise.title}
          </h3>
        </div>

        <p className="text-sm font-medium text-slate-800">
          {exercise.sets} serii × {exercise.reps} repetări
        </p>

        <p
          className={cn(
            "line-clamp-3 min-h-[3.75rem] text-sm leading-relaxed",
            exercise.instructions ? "text-slate-600" : "text-slate-400",
          )}
        >
          {exercise.instructions || "Fără instrucțiuni suplimentare."}
        </p>

        <div className="mt-auto flex flex-col gap-3 pt-1">
          <label
            className={cn(
              "flex min-h-[44px] items-center gap-3 rounded-xl border px-3 py-2",
              completed ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-slate-50",
              locked ? "cursor-not-allowed" : "cursor-pointer",
              pending && "pointer-events-none opacity-60",
              locked && "pointer-events-none",
            )}
          >
            <Checkbox
              checked={completed}
              disabled={controlsDisabled}
              onCheckedChange={(next) => {
                if (next === true) {
                  markCompleted()
                }
              }}
              className="size-5 border-slate-400 data-checked:border-[#042f2e] data-checked:bg-[#042f2e]"
              aria-label={`Efectuat: ${exercise.title}`}
            />
            <span className="text-sm font-semibold text-slate-800">
              {completed ? "Efectuat" : "Bifează după video"}
            </span>
          </label>
          <Button
            type="button"
            disabled={controlsDisabled}
            onClick={markCompleted}
            className={cn(
              "h-11 min-h-[44px] w-full rounded-xl",
              completed && "bg-emerald-600 hover:bg-emerald-600",
            )}
          >
            {pending ? "Se salvează…" : completed ? "Efectuat ✓" : "Marchează ca Efectuat"}
          </Button>
        </div>
      </div>
    </article>
  )
})

