"use client"

import { useState, useTransition, type ReactNode } from "react"
import { Loader2 } from "lucide-react"

import { createLibraryExercise } from "@/app/dashboard/exercises/actions"
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
  OBJECTIVES,
  POSITIONS,
  REGIONS,
  difficultyLabel,
  equipmentLabels,
  formatDuration,
  objectiveLabels,
  positionLabel,
  regionLabels,
} from "@/lib/exercises/taxonomy"
import type { AssignablePatient, LibraryExercise } from "@/lib/exercises/types"

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
          <dt className="text-slate-500">Regiuni</dt>
          <dd className="font-medium text-slate-900">{regionLabels(exercise.regions)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Obiective</dt>
          <dd className="font-medium text-slate-900">{objectiveLabels(exercise.objectives)}</dd>
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
            {exercise.sets} × {exercise.reps} · {equipmentLabels(exercise.equipments)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl">
          Închide
        </Button>
        <Button type="button" onClick={onAssign} className="h-11 rounded-xl">
          + Atribuie la pacient
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
      toast("Exercițiul a fost atribuit pacientului.")
      onClose()
    })
  }

  return (
    <Overlay title="Atribuie la pacient" onClose={onClose}>
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
  const [isPending, startCreate] = useTransition()
  const [regions, setRegions] = useState<string[]>([REGIONS[0].id])
  const [objectives, setObjectives] = useState<string[]>([OBJECTIVES[0].id])
  const [equipments, setEquipments] = useState<string[]>(["none"])

  function handleSubmit(formData: FormData) {
    startCreate(async () => {
      const result = await createLibraryExercise(formData)
      if (result.error || !result.exercise) {
        toast(result.error ?? "Nu am putut salva exercițiul în bibliotecă.")
        return
      }
      onCreated(result.exercise)
      toast("Exercițiul a fost adăugat în bibliotecă.")
      onClose()
    })
  }

  return (
    <Overlay title="Adaugă exercițiu" onClose={onClose}>
      <p className="mt-1 text-sm text-slate-600">
        Doar administratorul bibliotecii poate salva exerciții. Bifează una sau mai multe regiuni, obiective și
        echipamente.
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
        <MultiCheckField
          legend="Regiune anatomică"
          name="region"
          options={REGIONS}
          values={regions}
          onChange={setRegions}
        />
        <MultiCheckField
          legend="Obiectiv terapeutic"
          name="subcategory"
          options={OBJECTIVES}
          values={objectives}
          onChange={setObjectives}
        />
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="flex flex-col gap-2 sm:col-span-2">
            <MultiCheckField
              legend="Echipament"
              name="equipment"
              options={EQUIPMENT}
              values={equipments}
              onChange={(next) => {
                if (next.includes("none") && next.length > 1) {
                  setEquipments(next[next.length - 1] === "none" ? ["none"] : next.filter((id) => id !== "none"))
                  return
                }
                setEquipments(next.length > 0 ? next : ["none"])
              }}
            />
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
          <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="h-11 rounded-xl">
            Anulează
          </Button>
          <Button
            type="submit"
            disabled={isPending || regions.length === 0 || objectives.length === 0}
            className="h-11 rounded-xl"
          >
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se salvează…
              </>
            ) : (
              "Salvează în bibliotecă"
            )}
          </Button>
        </div>
      </form>
    </Overlay>
  )
}

function MultiCheckField({
  legend,
  name,
  options,
  values,
  onChange,
}: {
  legend: string
  name: string
  options: Array<{ id: string; label: string }>
  values: string[]
  onChange: (next: string[]) => void
}) {
  function toggle(id: string) {
    onChange(values.includes(id) ? values.filter((item) => item !== id) : [...values, id])
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-slate-900">{legend}</legend>
      <p className="text-xs text-slate-500">Poți bifa mai multe opțiuni.</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = values.includes(option.id)
          return (
            <label
              key={option.id}
              className={
                checked
                  ? "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-[#042f2e] bg-[#042f2e] px-3 text-sm font-medium text-white"
                  : "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-400"
              }
            >
              <input
                type="checkbox"
                name={name}
                value={option.id}
                checked={checked}
                onChange={() => toggle(option.id)}
                className="sr-only"
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
