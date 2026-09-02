"use client"

import { useMemo, useState, useTransition, type ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { addExercise } from "@/app/dashboard/patients/actions"
import { VideoPreview } from "@/components/media/video-preview"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import {
  DIFFICULTIES,
  EQUIPMENT,
  POSITIONS,
  REGIONS,
  difficultyLabel,
  equipmentLabel,
  formatDuration,
  positionLabel,
  subcategoryLabel,
} from "@/lib/exercises/taxonomy"
import type { AssignablePatient, LibraryExercise, TherapeuticObjective } from "@/lib/exercises/types"
import { youtubeIdFromUrl } from "@/lib/patients/youtube"

function Overlay({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Închide" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="library-dialog-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
      >
        <h2 id="library-dialog-title" className="text-lg font-semibold text-slate-900">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

export function PreviewDialog({
  exercise,
  onClose,
  onAssign,
}: {
  exercise: LibraryExercise
  onClose: () => void
  onAssign: () => void
}) {
  return (
    <Overlay title={exercise.title} onClose={onClose}>
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
        <VideoPreview url={exercise.videoUrl} title={exercise.title} />
      </div>
      <p className="mt-4 text-sm leading-relaxed text-slate-700">{exercise.description}</p>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Obiectiv</dt>
          <dd className="font-medium text-slate-900">{subcategoryLabel(exercise.region, exercise.subcategory)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Nivel</dt>
          <dd className="font-medium text-slate-900">{difficultyLabel(exercise.difficulty)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Poziție</dt>
          <dd className="font-medium text-slate-900">{positionLabel(exercise.position)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Durată video</dt>
          <dd className="font-medium text-slate-900">{formatDuration(exercise.durationSeconds)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Doza recomandată</dt>
          <dd className="font-medium text-slate-900">
            {exercise.sets} × {exercise.reps} · {equipmentLabel(exercise.equipment)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl">
          Închide
        </Button>
        <Button type="button" onClick={onAssign} className="h-11 rounded-xl">
          + Asignează la pacient
        </Button>
      </div>
    </Overlay>
  )
}

export function AssignDialog({
  exercise,
  patients,
  onClose,
}: {
  exercise: LibraryExercise
  patients: AssignablePatient[]
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function assign(patientId: string) {
    setError(null)
    startTransition(async () => {
      const formData = new FormData()
      formData.set("title", exercise.title)
      if (exercise.videoUrl) {
        formData.set("video_url", exercise.videoUrl)
      }
      formData.set("sets", String(exercise.sets))
      formData.set("reps", String(exercise.reps))
      formData.set("instructions", exercise.description)
      const result = await addExercise(patientId, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      toast("Exercițiul a fost asignat pacientului.")
      onClose()
    })
  }

  return (
    <Overlay title="Asignează la pacient" onClose={onClose}>
      <p className="mt-1 text-sm text-slate-600">
        Adaugă „{exercise.title}” în programul unui pacient. Seturile și repetările recomandate se copiază pe fișă.
      </p>
      {patients.length === 0 ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          Nu ai încă pacienți. Adaugă unul din panoul principal, apoi revino aici.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {patients.map((patient) => (
            <li key={patient.id}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => assign(patient.id)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60"
              >
                <span>
                  <span className="block font-medium text-slate-900">{patient.fullName}</span>
                  {patient.diagnosis ? (
                    <span className="block text-xs text-slate-500">{patient.diagnosis}</span>
                  ) : null}
                </span>
                {isPending ? <Loader2 className="size-4 animate-spin text-slate-400" /> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <div className="mt-5 flex justify-end">
        <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl">
          Anulează
        </Button>
      </div>
    </Overlay>
  )
}

export function AddExerciseDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (exercise: LibraryExercise) => void
}) {
  const [region, setRegion] = useState(REGIONS[0].id)
  const subcategories = useMemo(
    () => REGIONS.find((item) => item.id === region)?.subcategories ?? [],
    [region],
  )

  function handleSubmit(formData: FormData) {
    const title = String(formData.get("title") ?? "").trim()
    const description = String(formData.get("description") ?? "").trim()
    if (!title || !description) {
      toast("Completează titlul și descrierea.")
      return
    }
    const videoUrl = String(formData.get("video_url") ?? "").trim() || null
    const youtubeId = youtubeIdFromUrl(videoUrl)
    const created: LibraryExercise = {
      id: crypto.randomUUID(),
      title,
      description,
      region,
      subcategory: (String(formData.get("subcategory") || subcategories[0]?.id || "shoulder") as TherapeuticObjective),
      difficulty: (formData.get("difficulty") as LibraryExercise["difficulty"]) || "usor",
      equipment: (formData.get("equipment") as LibraryExercise["equipment"]) || "none",
      position: (formData.get("position") as LibraryExercise["position"]) || "sitting",
      sets: Number(formData.get("sets")) || 3,
      reps: Number(formData.get("reps")) || 10,
      durationSeconds: Number(formData.get("duration")) || 90,
      youtubeId,
      videoUrl,
      custom: true,
    }
    onCreated(created)
    toast("Exercițiul a fost adăugat în bibliotecă.")
    onClose()
  }

  return (
    <Overlay title="Adaugă exercițiu" onClose={onClose}>
      <p className="mt-1 text-sm text-slate-600">
        Intrarea se salvează local în bibliotecă, ca să poți filtra și asigna imediat.
      </p>
      <form action={handleSubmit} className="mt-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Titlu</Label>
          <Input id="title" name="title" required placeholder="Retracție cervicală" className="h-11" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Descriere / instrucțiuni</Label>
          <Textarea id="description" name="description" required className="min-h-24" placeholder="Cues clinice, precauții..." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="region">Regiune anatomică</Label>
            <select
              id="region"
              className="h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
              value={region}
              onChange={(event) => setRegion(event.target.value as typeof region)}
            >
              {REGIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="subcategory">Obiectiv terapeutic</Label>
            <select
              id="subcategory"
              name="subcategory"
              className="h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm"
              key={region}
              defaultValue={subcategories[0]?.id}
            >
              {subcategories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="difficulty">Nivel</Label>
            <select id="difficulty" name="difficulty" className="h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm">
              {DIFFICULTIES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="equipment">Echipament</Label>
            <select id="equipment" name="equipment" className="h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm">
              {EQUIPMENT.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="position">Poziție</Label>
            <select id="position" name="position" className="h-11 rounded-lg border border-slate-300 bg-white px-2.5 text-sm">
              {POSITIONS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="video_url">URL video</Label>
            <Input id="video_url" name="video_url" placeholder="https://youtube.com/..." className="h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sets">Seturi</Label>
            <Input id="sets" name="sets" type="number" min={1} defaultValue={3} className="h-11" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="reps">Repetări</Label>
            <Input id="reps" name="reps" type="number" min={1} defaultValue={10} className="h-11" />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="duration">Durată video (secunde)</Label>
          <Input id="duration" name="duration" type="number" min={15} defaultValue={90} className="h-11" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl">
            Anulează
          </Button>
          <Button type="submit" className="h-11 rounded-xl">
            Salvează în bibliotecă
          </Button>
        </div>
      </form>
    </Overlay>
  )
}
