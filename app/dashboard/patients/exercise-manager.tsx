"use client"

import { useOptimistic, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Library, Trash2 } from "lucide-react"

import { AssignExercisesModal } from "@/app/dashboard/assign-exercises-modal"
import { deleteExercise } from "@/app/dashboard/patients/actions"
import { VideoPreview } from "@/components/media/video-preview"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import type { ExerciseRecord } from "@/lib/patients/types-db"

export function ExerciseManager({
  patientId,
  patientName,
  exercises,
}: {
  patientId: string
  patientName: string
  exercises: ExerciseRecord[]
}) {
  const router = useRouter()
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticExercises, removeOptimistic] = useOptimistic(
    exercises,
    (state, exerciseId: string) => state.filter((item) => item.id !== exerciseId),
  )

  function remove(exerciseId: string) {
    startTransition(async () => {
      removeOptimistic(exerciseId)
      await deleteExercise(patientId, exerciseId)
      toast("Exercițiul a fost șters.")
    })
  }

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex justify-end">
        <Button type="button" onClick={() => setLibraryOpen(true)} className="h-11 rounded-xl">
          <Library className="size-4" />
          + Asignează din Bibliotecă
        </Button>
      </div>

      {optimisticExercises.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
          Nu există încă exerciții prescrise. Folosește biblioteca pentru a crea planul pacientului.
        </p>
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {optimisticExercises.map((exercise) => (
            <li key={exercise.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <VideoPreview url={exercise.video_url} title={exercise.title} />
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">{exercise.title}</h3>
                    <p className="text-sm text-slate-600">
                      {exercise.sets ?? "—"} serii × {exercise.reps ?? "—"} repetări
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => remove(exercise.id)}
                    disabled={isPending}
                    className="h-10 rounded-xl border-red-200 text-red-700"
                  >
                    <Trash2 className="size-4" />
                    Șterge
                  </Button>
                </div>
                {exercise.notes ? <p className="whitespace-pre-line text-sm text-slate-600">{exercise.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AssignExercisesModal
        open={libraryOpen}
        patientId={patientId}
        patientName={patientName}
        onClose={() => setLibraryOpen(false)}
        onSaved={() => router.refresh()}
      />
    </div>
  )
}
