"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import { Check, Loader2, Search } from "lucide-react"

import { createTrainingProtocol, updateTrainingProtocol } from "@/app/dashboard/protocols/actions"
import { DoseCountInput } from "@/components/exercises/dose-count-input"
import { LibraryQuickFilters } from "@/components/exercises/library-quick-filters"
import { Button } from "@/components/ui/button"
import { CenteredModal } from "@/components/ui/centered-modal"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import { doseCountDraft, parseDoseCount } from "@/lib/exercises/dose-input"
import { EMPTY_FILTERS, filterLibrary } from "@/lib/exercises/filter"
import { regionById } from "@/lib/exercises/taxonomy"
import type { LibraryExercise, LibraryFilters } from "@/lib/exercises/types"
import type { TrainingProtocol } from "@/lib/protocols/types"
import { cn } from "@/lib/utils"

type Dose = { sets: string; reps: string }

export function ProtocolEditorDialog({
  mode,
  catalog,
  initial,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit"
  catalog: LibraryExercise[]
  initial?: TrainingProtocol | null
  onClose: () => void
  onSaved: (protocol: TrainingProtocol) => void
}) {
  const [isPending, startSave] = useTransition()
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    (initial?.exercises ?? [])
      .map((item) => item.libraryExerciseId)
      .filter((id): id is string => Boolean(id)),
  )
  const [doses, setDoses] = useState<Record<string, Dose>>(() => {
    const next: Record<string, Dose> = {}
    for (const exercise of catalog) {
      next[exercise.id] = { sets: doseCountDraft(exercise.sets), reps: doseCountDraft(exercise.reps) }
    }
    for (const item of initial?.exercises ?? []) {
      if (!item.libraryExerciseId) {
        continue
      }
      next[item.libraryExerciseId] = {
        sets: doseCountDraft(item.sets ?? 3),
        reps: doseCountDraft(item.reps ?? 10),
      }
    }
    return next
  })

  const updateFilter = useCallback(<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])

  const filtered = useMemo(
    () => filterLibrary(catalog, { ...filters, query }),
    [catalog, filters, query],
  )

  const selectedExercises = useMemo(
    () =>
      selectedIds
        .map((id) => catalog.find((item) => item.id === id))
        .filter((item): item is LibraryExercise => Boolean(item)),
    [catalog, selectedIds],
  )

  function toggle(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  function save() {
    if (!title.trim()) {
      toast("Completează titlul protocolului.")
      return
    }
    if (selectedExercises.length === 0) {
      toast("Selectează cel puțin un exercițiu din bibliotecă.")
      return
    }

    const payload = {
      title,
      description,
      notes,
      region: initial?.region ?? null,
      difficulty: initial?.difficulty ?? null,
      exercises: selectedExercises.map((exercise) => ({
        libraryExerciseId: exercise.id,
        title: exercise.title,
        description: exercise.description,
        videoUrl: exercise.videoUrl,
        sets: parseDoseCount(doses[exercise.id]?.sets ?? doseCountDraft(exercise.sets)),
        reps: parseDoseCount(doses[exercise.id]?.reps ?? doseCountDraft(exercise.reps)),
      })),
    }

    startSave(async () => {
      const result =
        mode === "edit" && initial
          ? await updateTrainingProtocol(initial.id, payload)
          : await createTrainingProtocol(payload)
      if (result.error || !result.protocol) {
        toast(result.error ?? "Nu am putut salva protocolul.")
        return
      }
      onSaved(result.protocol)
      toast(mode === "edit" ? "Protocolul a fost actualizat." : "Protocolul a fost salvat în bibliotecă.")
      onClose()
    })
  }

  return (
    <CenteredModal
      wide
      title={mode === "edit" ? "Editează protocolul" : "Adaugă protocol nou"}
      titleId="protocol-dialog-title"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            {selectedIds.length} {selectedIds.length === 1 ? "exercițiu selectat" : "exerciții selectate"}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="h-11 rounded-xl">
              Anulează
            </Button>
            <Button
              type="button"
              onClick={save}
              disabled={isPending || selectedIds.length === 0 || !title.trim()}
              className="h-11 rounded-xl"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Se salvează…
                </>
              ) : mode === "edit" ? (
                "Salvează modificările"
              ) : (
                "Salvează protocolul"
              )}
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Șablon de exerciții din bibliotecă — fără structură pe săptămâni.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="protocol-title">Titlu</Label>
          <Input
            id="protocol-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="ex. Recuperare ACL — faza 1"
            className="h-11"
          />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="protocol-description">Descriere</Label>
            <Textarea
              id="protocol-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="min-h-16"
              placeholder="Obiective, indicații, precauții…"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="protocol-notes">Note interne</Label>
            <Textarea
              id="protocol-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="min-h-14"
              placeholder="Observații doar pentru echipă…"
            />
          </div>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută în bibliotecă…"
            className="h-11 border-slate-300 bg-white pl-9"
          />
        </div>
        <LibraryQuickFilters filters={filters} onChange={updateFilter} />

        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filtered.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-slate-500">
              Niciun exercițiu nu corespunde filtrelor.
            </li>
          ) : (
            filtered.map((exercise) => {
              const checked = selectedIds.includes(exercise.id)
              const dose = doses[exercise.id] ?? {
                sets: doseCountDraft(exercise.sets),
                reps: doseCountDraft(exercise.reps),
              }
              return (
                <li
                  key={exercise.id}
                  className={cn(
                    "flex flex-col gap-2 px-3 py-2.5 sm:grid sm:grid-cols-[auto_minmax(0,1fr)_4.5rem_4.5rem] sm:items-center sm:gap-2",
                    checked && "bg-teal-50/70",
                  )}
                >
                  <label className="flex size-10 cursor-pointer items-center justify-center">
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
                      onChange={() => toggle(exercise.id)}
                    />
                  </label>
                  <button type="button" onClick={() => toggle(exercise.id)} className="min-w-0 text-left">
                    <span className="block text-sm font-medium text-slate-900">{exercise.title}</span>
                    <span className="mt-0.5 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                      {exercise.regions.map((id) => regionById(id).shortLabel).join(" · ")}
                    </span>
                  </button>
                  <label className="text-[11px] font-medium text-slate-500">
                    Serii
                    <DoseCountInput
                      value={dose.sets}
                      onValueChange={(next) =>
                        setDoses((current) => ({
                          ...current,
                          [exercise.id]: { ...(current[exercise.id] ?? dose), sets: next },
                        }))
                      }
                      className="mt-0.5 h-9 px-2 text-center text-sm"
                    />
                  </label>
                  <label className="text-[11px] font-medium text-slate-500">
                    Rep.
                    <DoseCountInput
                      value={dose.reps}
                      onValueChange={(next) =>
                        setDoses((current) => ({
                          ...current,
                          [exercise.id]: { ...(current[exercise.id] ?? dose), reps: next },
                        }))
                      }
                      className="mt-0.5 h-9 px-2 text-center text-sm"
                    />
                  </label>
                </li>
              )
            })
          )}
        </ul>
      </div>
    </CenteredModal>
  )
}
