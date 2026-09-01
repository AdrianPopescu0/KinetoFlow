"use client"

import { VideoPreview } from "@/components/media/video-preview"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import type { Exercise } from "@/lib/patients/types"
import { cn } from "@/lib/utils"

type ExerciseCardProps = {
  exercise: Exercise
  completed: boolean
  onToggle: (exerciseId: string, completed: boolean) => void
}

export function ExerciseCard({ exercise, completed, onToggle }: ExerciseCardProps) {
  const src = exercise.videoUrl ?? (exercise.youtubeId ? `https://www.youtube.com/watch?v=${exercise.youtubeId}` : null)

  return (
    <article
      className={cn(
        surfaceCardClassName("overflow-hidden"),
        completed && "border-teal-200 ring-1 ring-teal-100",
      )}
    >
      <VideoPreview url={src} title={exercise.title} />

      <div className="flex flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">
            {exercise.category}
          </p>
          <h3 className="mt-0.5 text-lg font-semibold tracking-tight text-slate-800">
            {exercise.title}
          </h3>
        </div>

        <p className="text-sm font-medium text-slate-800">
          {exercise.sets} serii × {exercise.reps} repetări
        </p>
        {exercise.instructions ? (
          <p className="text-sm leading-relaxed text-slate-600">{exercise.instructions}</p>
        ) : null}

        <Button
          type="button"
          onClick={() => onToggle(exercise.id, !completed)}
          className={cn(
            "h-12 min-h-[48px] w-full rounded-xl",
            completed && "bg-emerald-600 hover:bg-emerald-600",
          )}
        >
          {completed ? "Efectuat ✓" : "Marchează ca Efectuat"}
        </Button>
      </div>
    </article>
  )
}
