"use client"

import { memo, useCallback, useMemo, useState, useTransition, type ChangeEvent } from "react"
import dynamic from "next/dynamic"
import { Plus, Search, X } from "lucide-react"

import { deleteLibraryExercise } from "@/app/dashboard/exercises/actions"
import { LibraryCard } from "@/app/dashboard/exercises/library-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { EMPTY_FILTERS, filterLibrary, regionCounts } from "@/lib/exercises/filter"
import {
  DIFFICULTIES,
  EQUIPMENT,
  OBJECTIVES,
  POSITIONS,
  REGIONS,
  difficultyLabel,
  equipmentLabel,
  positionLabel,
  regionById,
  subcategoryLabel,
} from "@/lib/exercises/taxonomy"
import { isExerciseLibraryEditor } from "@/lib/exercises/library-admin"
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
import { cn } from "@/lib/utils"

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
  const [, startDelete] = useTransition()
  const catalog = useMemo(() => {
    const storedIds = new Set(extras.map((item) => item.id))
    return [...extras, ...LIBRARY_EXERCISES.filter((item) => !storedIds.has(item.id))]
  }, [extras])
  const visible = useMemo(() => filterLibrary(catalog, filters), [catalog, filters])
  const counts = useMemo(
    () =>
      regionCounts(catalog, {
        query: filters.query,
        difficulty: filters.difficulty,
        equipment: filters.equipment,
        position: filters.position,
      }),
    [catalog, filters.difficulty, filters.equipment, filters.position, filters.query],
  )

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

  const deleteExercise = useCallback(
    (id: string) => {
      startDelete(async () => {
        const result = await deleteLibraryExercise(id)
        if (result.error) {
          toast(result.error)
          return
        }
        setExtras((current) => current.filter((item) => item.id !== id))
        toast("Exercițiul a fost șters din bibliotecă.")
      })
    },
    [],
  )

  const tags = useMemo(() => {
    const next: Array<{ key: string; label: string; onClear: () => void }> = []
    if (filters.region !== "all") {
      next.push({
        key: "region",
        label: regionById(filters.region).label,
        onClear: () => update("region", "all"),
      })
    }
    if (filters.subcategory !== "all") {
      next.push({
        key: "subcategory",
        label: subcategoryLabel(filters.subcategory),
        onClear: () => update("subcategory", "all"),
      })
    }
    if (filters.difficulty !== "all") {
      next.push({
        key: "difficulty",
        label: difficultyLabel(filters.difficulty),
        onClear: () => update("difficulty", "all"),
      })
    }
    if (filters.equipment !== "all") {
      next.push({
        key: "equipment",
        label: equipmentLabel(filters.equipment),
        onClear: () => update("equipment", "all"),
      })
    }
    if (filters.position !== "all") {
      next.push({
        key: "position",
        label: positionLabel(filters.position),
        onClear: () => update("position", "all"),
      })
    }
    return next
  }, [filters.difficulty, filters.equipment, filters.position, filters.region, filters.subcategory, update])

  return (
    <div className="flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bibliotecă Exerciții</h1>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm text-slate-600">
            Catalog clinic după regiune anatomică și obiectiv terapeutic. Caută, filtrează și asignează direct pe fișa
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

      <div
        role="tablist"
        aria-label="Regiune anatomică"
        className="mt-4 w-full overflow-x-auto pb-1 [scrollbar-width:thin]"
      >
        <div className="flex w-max min-w-full gap-2">
          <RegionPill
            active={filters.region === "all"}
            regionId="all"
            onSelect={setRegion}
            label="Toate"
            count={counts.all}
          />
          {REGIONS.map((region) => (
            <RegionPill
              key={region.id}
              active={filters.region === region.id}
              regionId={region.id}
              onSelect={setRegion}
              label={region.label}
              count={counts[region.id]}
            />
          ))}
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="mt-3 flex w-full flex-wrap items-center gap-1.5">
          {tags.map((tag) => (
            <button
              key={tag.key}
              type="button"
              onClick={tag.onClear}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 hover:border-slate-300 hover:bg-white"
            >
              {tag.label}
              <X className="size-3 text-slate-400" />
            </button>
          ))}
          <button
            type="button"
            onClick={resetFilters}
            className="px-1.5 text-xs font-medium text-teal-800 underline-offset-4 hover:underline"
          >
            Resetează
          </button>
        </div>
      ) : null}

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
              onDelete={canModifyLibrary && exercise.custom ? deleteExercise : undefined}
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

const RegionPill = memo(function RegionPill({
  active,
  regionId,
  onSelect,
  label,
  count,
}: {
  active: boolean
  regionId: string
  onSelect: (value: string) => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(regionId)}
      className={cn(
        "h-10 shrink-0 rounded-full border px-3.5 text-sm font-medium whitespace-nowrap transition",
        active
          ? "border-[#042f2e] bg-[#042f2e] text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {label}
      <span className={cn("ml-1.5 tabular-nums text-xs", active ? "text-white/75" : "text-slate-400")}>{count}</span>
    </button>
  )
})
