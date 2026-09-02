"use client"

import { useOptimistic, useState, useTransition } from "react"
import { Loader2, Trash2 } from "lucide-react"

import { addExercise, deleteExercise } from "@/app/dashboard/patients/actions"
import { VideoPreview } from "@/components/media/video-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import type { ExerciseRecord } from "@/lib/patients/types-db"

type OptimisticAction =
  | { type: "add"; exercise: ExerciseRecord }
  | { type: "remove"; id: string }

export function ExerciseManager({
  patientId,
  exercises,
}: {
  patientId: string
  exercises: ExerciseRecord[]
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [optimisticExercises, applyOptimistic] = useOptimistic(exercises, (state, action: OptimisticAction) => {
    if (action.type === "add") {
      return [action.exercise, ...state.filter((item) => item.id !== action.exercise.id)]
    }
    return state.filter((item) => item.id !== action.id)
  })

  function add(formData: FormData) {
    setError(null)
    const title = String(formData.get("title") ?? "").trim()
    const temp: ExerciseRecord = {
      id: `tmp-${crypto.randomUUID()}`,
      patient_id: patientId,
      title,
      video_url: String(formData.get("video_url") ?? "") || null,
      sets: Number(formData.get("sets")) || null,
      reps: Number(formData.get("reps")) || null,
      notes: String(formData.get("instructions") ?? "") || null,
    }

    startTransition(async () => {
      applyOptimistic({ type: "add", exercise: temp })
      const result = await addExercise(patientId, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      toast("Exercițiul a fost adăugat.")
    })
  }

  function remove(exerciseId: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", id: exerciseId })
      await deleteExercise(patientId, exerciseId)
      toast("Exercițiul a fost șters.")
    })
  }

  return (
    <div className="flex flex-col gap-6 p-5">
      <form action={add} className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="title">Titlu</Label>
          <Input id="title" name="title" required placeholder="Pendul Codman" className="h-11 bg-white" />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="video_url">URL video YouTube / MP4</Label>
          <Input
            id="video_url"
            name="video_url"
            placeholder="https://www.youtube.com/watch?v=..."
            className="h-11 bg-white"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sets">Serii</Label>
          <Input id="sets" name="sets" type="number" min={1} placeholder="3" className="h-11 bg-white" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="reps">Repetări</Label>
          <Input id="reps" name="reps" type="number" min={1} placeholder="12" className="h-11 bg-white" />
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="instructions">Instrucțiuni</Label>
          <Textarea id="instructions" name="instructions" placeholder="Mișcare lentă, fără durere." className="min-h-20 bg-white" />
        </div>
        {error ? <p className="sm:col-span-2 text-sm text-red-700">{error}</p> : null}
        <div className="sm:col-span-2">
          <Button type="submit" disabled={isPending} className="h-11 rounded-xl">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se salvează…
              </>
            ) : (
              "Adaugă exercițiu"
            )}
          </Button>
        </div>
      </form>

      {optimisticExercises.length === 0 ? (
        <p className="text-sm text-slate-600">Nu există încă exerciții prescrise.</p>
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
                    disabled={isPending || exercise.id.startsWith("tmp-")}
                    className="h-10 rounded-xl border-red-200 text-red-700"
                  >
                    <Trash2 className="size-4" />
                    Șterge
                  </Button>
                </div>
                {exercise.notes ? <p className="text-sm text-slate-600">{exercise.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
