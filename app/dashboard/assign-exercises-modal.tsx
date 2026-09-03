"use client"

import { useMemo, useState, useTransition } from "react"
import { Check, Loader2, Search, X } from "lucide-react"

import { assignExercisesBatch } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { loadCustomExercises } from "@/lib/exercises/extras"
import { formatTreatmentInterval } from "@/lib/exercises/schedule"
import { regionById } from "@/lib/exercises/taxonomy"
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
}: {
  patientId: string
  patientName: string
  open: boolean
  onClose: () => void
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
    />
  )
}

function AssignExercisesModalContent({
  patientId,
  patientName,
  onClose,
}: {
  patientId: string
  patientName: string
  onClose: () => void
}) {
  const initialInterval = intervalFromToday(7)
  const [query, setQuery] = useState("")
  const [startDate, setStartDate] = useState(initialInterval.startDate)
  const [endDate, setEndDate] = useState(initialInterval.endDate)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [catalog] = useState<LibraryExercise[]>(() => [...loadCustomExercises(), ...LIBRARY_EXERCISES])
  const [doses, setDoses] = useState<Record<string, Dose>>(() =>
    Object.fromEntries(
      [...loadCustomExercises(), ...LIBRARY_EXERCISES].map((exercise) => [
        exercise.id,
        { sets: exercise.sets, reps: exercise.reps },
      ]),
    ),
  )
  const [isPending, startTransition] = useTransition()

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ro-RO")
    if (!needle) {
      return catalog
    }
    return catalog.filter((exercise) =>
      `${exercise.title} ${exercise.description} ${regionById(exercise.region).label}`
        .toLocaleLowerCase("ro-RO")
        .includes(needle),
    )
  }, [catalog, query])

  const intervalValid = Boolean(startDate && endDate && startDate <= endDate)
  const intervalLabel = intervalValid ? formatTreatmentInterval(startDate, endDate) : "interval invalid"

  function setShortcut(days: number) {
    const interval = intervalFromToday(days)
    setStartDate(interval.startDate)
    setEndDate(interval.endDate)
  }

  function toggleExercise(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function updateDose(id: string, field: keyof Dose, raw: string) {
    const value = Math.max(1, Math.min(99, Number.parseInt(raw, 10) || 1))
    setDoses((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { sets: 1, reps: 1 }), [field]: value },
    }))
  }

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
          ? `1 exercițiu a fost adăugat în planul lui ${patientName}.`
          : `${result.inserted} exerciții au fost adăugate în planul lui ${patientName}.`,
      )
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-4">
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
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
          <h2 id="assign-exercises-title" className="truncate text-lg font-semibold text-slate-900">
            Asignează exerciții — {patientName}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Închide"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <section>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                Perioadă de tratament
              </p>
              <div className="flex gap-1.5">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setShortcut(days)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-teal-600 hover:bg-teal-50"
                  >
                    {days} zile
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                De la
                <Input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-10 border-slate-300"
                />
              </label>
              <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
                Până la
                <Input
                  type="date"
                  min={startDate}
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-10 border-slate-300"
                />
              </label>
            </div>
          </section>

          <section>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Caută exerciții după titlu sau regiune"
                className="h-10 border-slate-300 pl-9"
              />
            </div>

            <ul className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
              {filtered.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  Niciun exercițiu găsit.
                </li>
              ) : (
                filtered.map((exercise) => {
                  const checked = selectedIds.includes(exercise.id)
                  const dose = doses[exercise.id] ?? {
                    sets: exercise.sets,
                    reps: exercise.reps,
                  }
                  return (
                    <li
                      key={exercise.id}
                      className={cn(
                        "grid grid-cols-[auto_minmax(0,1fr)_4rem_4rem] items-center gap-2 px-3 py-2.5",
                        checked && "bg-teal-50/60",
                      )}
                    >
                      <label className="flex size-8 cursor-pointer items-center justify-center">
                        <span
                          className={cn(
                            "flex size-5 items-center justify-center rounded-md border",
                            checked
                              ? "border-[#042f2e] bg-[#042f2e] text-white"
                              : "border-slate-300 bg-white",
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
                      </label>

                      <button
                        type="button"
                        onClick={() => toggleExercise(exercise.id)}
                        className="min-w-0 text-left"
                      >
                        <span className="block truncate text-sm font-medium text-slate-900">
                          {exercise.title}
                        </span>
                        <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {regionById(exercise.region).shortLabel}
                        </span>
                      </button>

                      <label className="text-[10px] font-medium text-slate-500">
                        Seturi
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={dose.sets}
                          onChange={(event) => updateDose(exercise.id, "sets", event.target.value)}
                          className="mt-0.5 h-8 px-2 text-center text-xs"
                        />
                      </label>
                      <label className="text-[10px] font-medium text-slate-500">
                        Repetări
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={dose.reps}
                          onChange={(event) => updateDose(exercise.id, "reps", event.target.value)}
                          className="mt-0.5 h-8 px-2 text-center text-xs"
                        />
                      </label>
                    </li>
                  )
                })
              )}
            </ul>
          </section>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-600">
            {selectedIds.length} {selectedIds.length === 1 ? "exercițiu selectat" : "exerciții selectate"}{" "}
            pentru intervalul <span className="font-semibold text-slate-800">{intervalLabel}</span>.
          </p>
          <div className="flex shrink-0 justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 rounded-xl"
              disabled={isPending}
            >
              Anulează
            </Button>
            <Button
              type="button"
              onClick={save}
              className="h-11 rounded-xl"
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
