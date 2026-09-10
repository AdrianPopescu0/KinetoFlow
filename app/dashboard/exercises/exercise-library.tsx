"use client"

import { memo, useCallback, useEffect, useMemo, useState, useTransition, type ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { Plus, Search } from "lucide-react"

import { deleteLibraryExercise } from "@/app/dashboard/exercises/actions"
import { LibraryCard } from "@/app/dashboard/exercises/library-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { EMPTY_FILTERS, filterLibrary } from "@/lib/exercises/filter"
import { isExerciseLibraryEditor } from "@/lib/exercises/library-admin"
import {
  HIDDEN_LIBRARY_IDS_KEY,
  mergeLibraryCatalog,
  parseHiddenLibraryIds,
  serializeHiddenLibraryIds,
} from "@/lib/exercises/merge-catalog"
import {
  DIFFICULTIES,
  EQUIPMENT,
  OBJECTIVES,
  POSITIONS,
  REGIONS,
} from "@/lib/exercises/taxonomy"
import type {
  AnatomicalRegion,
  AssignablePatient,
  Difficulty,
  Equipment,
  ExercisePosition,
  LibraryExercise,
  LibraryFilters,
  TherapeuticObjective,
} from "@/lib/exercises/types"

const PreviewDialog = dynamic(
  () => import("@/app/dashboard/exercises/library-dialogs").then((mod) => ({ default: mod.PreviewDialog })),
  { ssr: false },
)
const AssignDialog = dynamic(
  () => import("@/app/dashboard/exercises/library-dialogs").then((mod) => ({ default: mod.AssignDialog })),
  { ssr: false },
)
const AddExerciseDialog = dynamic(
  () => import("@/app/dashboard/exercises/library-dialogs").then((mod) => ({ default: mod.AddExerciseDialog })),
  { ssr: false },
)

const REGION_FILTER_OPTIONS = [
  { id: "all", label: "Toate regiunile" },
  ...REGIONS.map((region) => ({ id: region.id, label: region.label })),
]
const OBJECTIVE_FILTER_OPTIONS = [{ id: "all", label: "Toate obiectivele" }, ...OBJECTIVES]
const DIFFICULTY_FILTER_OPTIONS = [{ id: "all", label: "Orice nivel" }, ...DIFFICULTIES]
const EQUIPMENT_FILTER_OPTIONS = [{ id: "all", label: "Orice echipament" }, ...EQUIPMENT]
const POSITION_FILTER_OPTIONS = [{ id: "all", label: "Orice poziție" }, ...POSITIONS]

export function ExerciseLibrary({
  patients,
  storedExercises,
  canEditLibrary,
  viewerEmail,
}: {
  patients: AssignablePatient[]
  storedExercises: LibraryExercise[]
  canEditLibrary: boolean
  viewerEmail?: string | null
}) {
  const canModifyLibrary = canEditLibrary || isExerciseLibraryEditor(viewerEmail)
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [preview, setPreview] = useState<LibraryExercise | null>(null)
  const [assign, setAssign] = useState<LibraryExercise | null>(null)
  const [adding, setAdding] = useState(false)
  const [extras, setExtras] = useState(storedExercises)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => new Set())
  const [, startDelete] = useTransition()

  useEffect(() => {
    try {
      setHiddenIds(new Set(parseHiddenLibraryIds(window.localStorage.getItem(HIDDEN_LIBRARY_IDS_KEY))))
    } catch {
      // localStorage indisponibil (Safari privat, etc.)
    }
  }, [])

  const catalog = useMemo(
    () => mergeLibraryCatalog(extras, LIBRARY_EXERCISES, hiddenIds),
    [extras, hiddenIds],
  )
  const visible = useMemo(() => filterLibrary(catalog, filters), [catalog, filters])

  const update = useCallback(<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }))
  }, [])

  const setQuery = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilters((current) => ({ ...current, query: event.target.value }))
  }, [])

  const setRegion = useCallback((value: string) => {
    update("region", value as AnatomicalRegion | "all")
  }, [update])

  const setObjective = useCallback((value: string) => {
    update("subcategory", value as TherapeuticObjective | "all")
  }, [update])

  const setDifficulty = useCallback((value: string) => {
    update("difficulty", value as Difficulty | "all")
  }, [update])

  const setEquipment = useCallback((value: string) => {
    update("equipment", value as Equipment | "all")
  }, [update])

  const setPosition = useCallback((value: string) => {
    update("position", value as ExercisePosition | "all")
  }, [update])

  const resetFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS)
  }, [])

  const openPreview = useCallback((exercise: LibraryExercise) => {
    setPreview(exercise)
  }, [])

  const openAssign = useCallback((exercise: LibraryExercise) => {
    setAssign(exercise)
  }, [])

  const closePreview = useCallback(() => {
    setPreview(null)
  }, [])

  const closeAssign = useCallback(() => {
    setAssign(null)
  }, [])

  const closeAdding = useCallback(() => {
    setAdding(false)
  }, [])

  const assignFromPreview = useCallback(() => {
    if (preview) {
      setAssign(preview)
    }
    setPreview(null)
  }, [preview])

  const onCreated = useCallback((exercise: LibraryExercise) => {
    setExtras((current) => [exercise, ...current])
  }, [])

  const deleteExercise = useCallback((id: string) => {
    startDelete(async () => {
      const result = await deleteLibraryExercise(id)
      if (result.error) {
        toast(result.error)
        return
      }
      setExtras((current) => current.filter((item) => item.id !== id))
      setHiddenIds((current) => {
        const next = new Set(current)
        next.add(id)
        try {
          window.localStorage.setItem(HIDDEN_LIBRARY_IDS_KEY, serializeHiddenLibraryIds(next))
        } catch {
          // ignore quota / private mode
        }
        return next
      })
      toast("Exercițiul a fost șters din bibliotecă.")
    })
  }, [])

  return (
    <div className="flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bibliotecă Exerciții</h1>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm text-slate-600">
            Catalog clinic după regiune anatomică și obiectiv terapeutic. Caută, filtrează și atribuie direct pe fișa
            pacientului.
          </p>
          {canModifyLibrary ? (
            <Button type="button" onClick={() => setAdding(true)} className="h-11 shrink-0 rounded-xl">
              <Plus className="size-4" />
              Adaugă exercițiu
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" />
          <Input
            value={filters.query}
            onChange={setQuery}
            placeholder="Caută după titlu sau descriere…"
            className="h-12 w-full rounded-xl pl-11 text-base"
            aria-label="Caută exerciții"
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
          <FilterSelect
            label="Regiuni"
            value={filters.region}
            onChange={setRegion}
            options={REGION_FILTER_OPTIONS}
          />
          <FilterSelect
            label="Obiectiv"
            value={filters.subcategory}
            onChange={setObjective}
            options={OBJECTIVE_FILTER_OPTIONS}
          />
          <FilterSelect
            label="Nivel"
            value={filters.difficulty}
            onChange={setDifficulty}
            options={DIFFICULTY_FILTER_OPTIONS}
          />
          <FilterSelect
            label="Echipament"
            value={filters.equipment}
            onChange={setEquipment}
            options={EQUIPMENT_FILTER_OPTIONS}
          />
          <FilterSelect
            label="Poziție"
            value={filters.position}
            onChange={setPosition}
            options={POSITION_FILTER_OPTIONS}
          />
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 flex min-h-[min(28rem,55vh)] w-full flex-1 items-center justify-center">
          <div className="w-full max-w-md rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
            <p className="font-medium text-slate-800">Niciun exercițiu nu corespunde filtrelor.</p>
            <p className="mt-1 text-sm text-slate-600">Șterge un filtru sau caută alt termen.</p>
            <Button type="button" variant="outline" className="mt-4 h-11 rounded-xl" onClick={resetFilters}>
              Resetează filtrele
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((exercise) => (
            <LibraryCard
              key={exercise.id}
              exercise={exercise}
              onPreview={openPreview}
              onAssign={openAssign}
              onDelete={canModifyLibrary ? deleteExercise : undefined}
            />
          ))}
        </div>
      )}

      {preview ? (
        <PreviewDialog exercise={preview} onClose={closePreview} onAssign={assignFromPreview} />
      ) : null}
      {assign ? <AssignDialog exercise={assign} patients={patients} onClose={closeAssign} /> : null}
      {adding && canModifyLibrary ? <AddExerciseDialog onClose={closeAdding} onCreated={onCreated} /> : null}
    </div>
  )
}

const FilterSelect = memo(function FilterSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; label: string }>
  disabled?: boolean
}) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 max-w-[16.5rem] min-w-[8.5rem] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:border-[#042f2e] focus-visible:ring-3 focus-visible:ring-[#042f2e]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
})
