"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { Check, Loader2, Search, X } from "lucide-react"

import { assignExercisesBatch } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { loadCustomExercises } from "@/lib/exercises/extras"
import {
  ALL_WEEKDAY_IDS,
  WEEKDAY_OPTIONS,
  type WeekdayId,
} from "@/lib/exercises/schedule"
import type { LibraryExercise } from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

export function AssignExercisesModal({
  patientId,
  patientName,
  open,
  onClose,
}: {
  patientId: string
  patientName: string
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState("")
  const [selectedDays, setSelectedDays] = useState<WeekdayId[]>([...ALL_WEEKDAY_IDS])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [catalog, setCatalog] = useState<LibraryExercise[]>(LIBRARY_EXERCISES)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      return
    }
    setQuery("")
    setSelectedDays([...ALL_WEEKDAY_IDS])
    setSelectedIds([])
    setCatalog([...loadCustomExercises(), ...LIBRARY_EXERCISES])
  }, [open, patientId])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) {
      return catalog
    }
    return catalog.filter((exercise) => {
      const haystack = `${exercise.title} ${exercise.description}`.toLowerCase()
      return haystack.includes(needle)
    })
  }, [catalog, query])

  const allWeekSelected = selectedDays.length === ALL_WEEKDAY_IDS.length

  function toggleDay(day: WeekdayId) {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    )
  }

  function toggleAllWeek() {
    setSelectedDays((current) =>
      current.length === ALL_WEEKDAY_IDS.length ? [] : [...ALL_WEEKDAY_IDS],
    )
  }

  function toggleExercise(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function save() {
    if (selectedIds.length === 0) {
      toast("Selectează cel puțin un exercițiu.")
      return
    }
    if (selectedDays.length === 0) {
      toast("Selectează cel puțin o zi.")
      return
    }

    const exercises = catalog
      .filter((exercise) => selectedIds.includes(exercise.id))
      .map((exercise) => ({
        title: exercise.title,
        videoUrl: exercise.videoUrl,
        sets: exercise.sets,
        reps: exercise.reps,
        description: exercise.description,
      }))

    startTransition(async () => {
      const result = await assignExercisesBatch(patientId, exercises, selectedDays)
      if (result.error) {
        toast(result.error)
        return
      }
      toast(
        result.inserted === 1
          ? `1 exercițiu a fost adăugat în planul lui ${patientName}.`
          : `${result.inserted} exerciții au fost adăugate în planul lui ${patientName}.`,
      )
      onClose()
    })
  }

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" aria-label="Închide" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-exercises-title"
        className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <div>
            <h2 id="assign-exercises-title" className="text-lg font-semibold text-slate-900">
              Asignare rapidă exerciții
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Plan pentru <span className="font-medium text-slate-800">{patientName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Închide"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Zile</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={toggleAllWeek}
                className={cn(
                  "h-10 rounded-xl border px-3 text-sm font-medium transition-colors",
                  allWeekSelected
                    ? "border-[#042f2e] bg-[#042f2e] text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300",
                )}
              >
                Toată săptămâna
              </button>
              {WEEKDAY_OPTIONS.map((day) => {
                const active = selectedDays.includes(day.id)
                return (
                  <button
                    key={day.id}
                    type="button"
                    aria-pressed={active}
                    title={day.label}
                    onClick={() => toggleDay(day.id)}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-xl border text-sm font-semibold transition-colors",
                      active
                        ? "border-teal-700 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                    )}
                  >
                    {day.short}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Exerciții din bibliotecă
            </p>
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Caută după titlu sau instrucțiuni"
                className="h-11 border-slate-300 pl-9"
              />
            </div>
            <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-slate-500">Niciun exercițiu găsit.</li>
              ) : (
                filtered.map((exercise) => {
                  const checked = selectedIds.includes(exercise.id)
                  return (
                    <li key={exercise.id}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50",
                          checked && "bg-teal-50/60",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border",
                            checked ? "border-[#042f2e] bg-[#042f2e] text-white" : "border-slate-300 bg-white",
                          )}
                        >
                          {checked ? <Check className="size-3" /> : null}
                        </span>
                        <input
                          type="checkbox"
                          className="sr-only"
                          checked={checked}
                          onChange={() => toggleExercise(exercise.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-medium text-slate-900">{exercise.title}</span>
                          <span className="mt-0.5 block text-xs text-slate-500">
                            {exercise.sets} × {exercise.reps}
                            {exercise.custom ? " · personalizat" : ""}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })
              )}
            </ul>
            <p className="mt-2 text-xs text-slate-500">
              {selectedIds.length === 0
                ? "Niciun exercițiu selectat"
                : selectedIds.length === 1
                  ? "1 exercițiu selectat"
                  : `${selectedIds.length} exerciții selectate`}
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={onClose} className="h-11 rounded-xl" disabled={isPending}>
            Anulează
          </Button>
          <Button type="button" onClick={save} className="h-11 rounded-xl" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se salvează…
              </>
            ) : (
              "Salvează Planul"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
