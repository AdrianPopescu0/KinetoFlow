"use client"

import { memo, useCallback, useEffect, useMemo, useState, useTransition } from "react"
import { Check, Loader2, Search, X } from "lucide-react"

import { loadStoredLibraryExercises } from "@/app/dashboard/exercises/actions"
import { assignExercisesBatch, listAssignedExercisesForPatient } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import {
  librarySelectionForAssignedInterval,
  preferredTreatmentInterval,
  type AssignedProgramExercise,
} from "@/lib/exercises/assigned-selection"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { loadCustomExercises } from "@/lib/exercises/extras"
import { formatTreatmentInterval } from "@/lib/exercises/schedule"
import { regionById, regionLabels } from "@/lib/exercises/taxonomy"
import type { LibraryExercise } from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

type Dose = { sets: number; reps: number }

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function intervalFromToday(days: number): { startDate: string; endDate: string } {
  const start = new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + days - 1)
  return { startDate: localDateKey(start), endDate: localDateKey(end) }
}

export function AssignExercisesModal({
  patientId,
  patientName,
  open,
  onClose,
  onSaved,
  initialAssigned,
}: {
  patientId: string
  patientName: string
  open: boolean
  onClose: () => void
  onSaved?: () => void
  initialAssigned?: AssignedProgramExercise[]
}) {
  if (!open) {
    return null
  }

  return (
    <AssignExercisesModalContent
      key={patientId}
      patientId={patientId}
      patientName={patientName}
      onClose={onClose}
      onSaved={onSaved}
      initialAssigned={initialAssigned}
    />
  )
}

function AssignExercisesModalContent({
  patientId,
  patientName,
  onClose,
  onSaved,
  initialAssigned = [],
}: {
  patientId: string
  patientName: string
  onClose: () => void
  onSaved?: () => void
  initialAssigned?: AssignedProgramExercise[]
}) {
  const fallbackInterval = intervalFromToday(7)
  const openingInterval = preferredTreatmentInterval(
    initialAssigned,
    fallbackInterval,
    localDateKey(new Date()),
  )
  const openingCatalog = [...loadCustomExercises(), ...LIBRARY_EXERCISES]
  const openingSelection = librarySelectionForAssignedInterval(
    openingCatalog,
    initialAssigned,
    openingInterval,
  )
  const [query, setQuery] = useState("")
  const [startDate, setStartDate] = useState(openingInterval.startDate)
  const [endDate, setEndDate] = useState(openingInterval.endDate)
  const [datesTouched, setDatesTouched] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(openingSelection.selectedIds)
  const [assigned, setAssigned] = useState<AssignedProgramExercise[]>(initialAssigned)
  const [assignedLoading, setAssignedLoading] = useState(true)
  const [catalog, setCatalog] = useState<LibraryExercise[]>(openingCatalog)
  const [doses, setDoses] = useState<Record<string, Dose>>(() => ({
    ...Object.fromEntries(
      openingCatalog.map((exercise) => [exercise.id, { sets: exercise.sets, reps: exercise.reps }]),
    ),
    ...openingSelection.doses,
  }))
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    void loadStoredLibraryExercises().then((stored) => {
      if (stored.length === 0) {
        return
      }
      setCatalog((current) => {
        const ids = new Set(stored.map((item) => item.id))
        return [...stored, ...current.filter((item) => !ids.has(item.id))]
      })
      setDoses((current) => {
        const next = { ...current }
        for (const exercise of stored) {
          next[exercise.id] = current[exercise.id] ?? { sets: exercise.sets, reps: exercise.reps }
        }
        return next
      })
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    void listAssignedExercisesForPatient(patientId).then((result) => {
      if (cancelled) {
        return
      }
      if (result.error) {
        toast(result.error)
        setAssignedLoading(false)
        return
      }
      setAssigned(result.exercises)
      setAssignedLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [patientId])

  useEffect(() => {
    if (!datesTouched) {
      const preferred = preferredTreatmentInterval(
        assigned,
        intervalFromToday(7),
        localDateKey(new Date()),
      )
      if (preferred.startDate !== startDate || preferred.endDate !== endDate) {
        setStartDate(preferred.startDate)
        setEndDate(preferred.endDate)
        return
      }
    }
    const selection = librarySelectionForAssignedInterval(catalog, assigned, { startDate, endDate })
    setSelectedIds(selection.selectedIds)
    setDoses((current) => ({ ...current, ...selection.doses }))
  }, [assigned, catalog, datesTouched, endDate, startDate])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ro-RO")
    if (!needle) {
      return catalog
    }
    return catalog.filter((exercise) =>
      `${exercise.title} ${exercise.description} ${regionLabels(exercise.regions)}`
        .toLocaleLowerCase("ro-RO")
        .includes(needle),
    )
  }, [catalog, query])

  const intervalValid = Boolean(startDate && endDate && startDate <= endDate)
  const intervalLabel = intervalValid ? formatTreatmentInterval(startDate, endDate) : "interval invalid"

  const toggleExercise = useCallback((id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const updateDose = useCallback((id: string, field: keyof Dose, raw: string) => {
    const value = Math.max(1, Math.min(99, Number.parseInt(raw, 10) || 1))
    setDoses((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { sets: 1, reps: 1 }), [field]: value },
    }))
  }, [])

  function save() {
    if (selectedIds.length === 0) {
      toast("Selectează cel puțin un exercițiu.")
      return
    }
    if (!intervalValid) {
      toast("Alege un interval de tratament valid.")
      return
    }

    const exercises = catalog
      .filter((exercise) => selectedIds.includes(exercise.id))
      .map((exercise) => ({
        title: exercise.title,
        videoUrl: exercise.videoUrl,
        sets: doses[exercise.id]?.sets ?? exercise.sets,
        reps: doses[exercise.id]?.reps ?? exercise.reps,
        description: exercise.description,
      }))

    startTransition(async () => {
      const result = await assignExercisesBatch(patientId, exercises, { startDate, endDate })
      if (result.error) {
        toast(result.error)
        return
      }
      toast(
        result.inserted === 1
          ? `Planul lui ${patientName} a fost actualizat (1 exercițiu).`
          : `Planul lui ${patientName} a fost actualizat (${result.inserted} exerciții).`,
      )
      onClose()
      onSaved?.()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        aria-label="Închide"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-exercises-title"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className="relative z-10 flex h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-xl sm:h-auto sm:max-h-[94vh] sm:rounded-2xl"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
          <h2 id="assign-exercises-title" className="min-w-0 text-base font-semibold text-slate-900 sm:text-lg">
            Atribuie exerciții — {patientName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Închide"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="shrink-0 space-y-3 border-b border-slate-100 px-4 py-3 sm:px-5">
          <section>
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              Perioadă de tratament
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                De la
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => {
                    setDatesTouched(true)
                    setStartDate(event.target.value)
                  }}
                  className="h-11 min-h-11 border-slate-300 text-base md:text-sm"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Până la
                <Input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(event) => {
                    setDatesTouched(true)
                    setEndDate(event.target.value)
                  }}
                  className="h-11 min-h-11 border-slate-300 text-base md:text-sm"
                />
              </label>
            </div>
          </section>

          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Caută exerciții după titlu sau regiune"
              className="h-11 min-h-11 border-slate-300 pl-9 text-base md:text-sm"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          {assignedLoading ? (
            <p className="mb-3 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Se încarcă exercițiile deja din program…
            </p>
          ) : null}
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
            {filtered.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-slate-500">Niciun exercițiu găsit.</li>
            ) : (
              filtered.map((exercise) => {
                const dose = doses[exercise.id] ?? {
                  sets: exercise.sets,
                  reps: exercise.reps,
                }
                return (
                  <AssignExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    checked={selectedIds.includes(exercise.id)}
                    sets={dose.sets}
                    reps={dose.reps}
                    onToggle={toggleExercise}
                    onDoseChange={updateDose}
                  />
                )
              })
            )}
          </ul>
        </div>

        <footer className="flex shrink-0 flex-col gap-3 border-t border-slate-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:pb-4">
          <p className="text-xs leading-relaxed text-slate-600">
            {selectedIds.length} {selectedIds.length === 1 ? "exercițiu selectat" : "exerciții selectate"}{" "}
            pentru intervalul <span className="font-semibold text-slate-800">{intervalLabel}</span>.
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-12 min-h-12 rounded-xl"
              disabled={isPending}
            >
              Anulează
            </Button>
            <Button
              type="button"
              onClick={save}
              className="h-12 min-h-12 rounded-xl"
              disabled={isPending || selectedIds.length === 0 || !intervalValid}
            >
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
        </footer>
      </div>
    </div>
  )
}

const AssignExerciseRow = memo(function AssignExerciseRow({
  exercise,
  checked,
  sets,
  reps,
  onToggle,
  onDoseChange,
}: {
  exercise: LibraryExercise
  checked: boolean
  sets: number
  reps: number
  onToggle: (id: string) => void
  onDoseChange: (id: string, field: keyof Dose, raw: string) => void
}) {
  return (
    <li
      className={cn(
        "flex flex-col gap-2 px-3 py-3 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_5.5rem_5.5rem] sm:items-center sm:gap-2 sm:py-2.5",
        checked && "bg-teal-50/60",
      )}
    >
      <div className="flex min-w-0 items-start gap-2 sm:contents">
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <span
            className={cn(
              "flex size-6 items-center justify-center rounded-md border",
              checked ? "border-[#042f2e] bg-[#042f2e] text-white" : "border-slate-300 bg-white",
            )}
          >
            {checked ? <Check className="size-3.5" /> : null}
          </span>
          <input
            type="checkbox"
            className="sr-only"
            checked={checked}
            onChange={() => onToggle(exercise.id)}
          />
        </label>

        <button type="button" onClick={() => onToggle(exercise.id)} className="min-w-0 flex-1 py-1.5 text-left">
          <span className="block text-sm font-medium text-slate-900 sm:truncate">{exercise.title}</span>
          <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
            {exercise.regions.map((id) => regionById(id).shortLabel).join(" · ")}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:contents">
        <label
          className="text-xs font-medium text-slate-500"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          Seturi
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={sets}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onDoseChange(exercise.id, "sets", event.target.value)}
            className="mt-0.5 h-11 min-h-11 px-2 text-center text-base md:h-9 md:min-h-9 md:text-sm"
          />
        </label>
        <label
          className="text-xs font-medium text-slate-500"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          Repetări
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={99}
            value={reps}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
            onChange={(event) => onDoseChange(exercise.id, "reps", event.target.value)}
            className="mt-0.5 h-11 min-h-11 px-2 text-center text-base md:h-9 md:min-h-9 md:text-sm"
          />
        </label>
      </div>
    </li>
  )
})

