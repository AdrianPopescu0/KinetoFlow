"use client"

import { useMemo, useState, useTransition } from "react"
import { Plus, Search, X } from "lucide-react"

import { deleteLibraryExercise } from "@/app/dashboard/exercises/actions"
import { LibraryCard } from "@/app/dashboard/exercises/library-card"
import { AddExerciseDialog, AssignDialog, PreviewDialog } from "@/app/dashboard/exercises/library-dialogs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { EMPTY_FILTERS, filterLibrary, regionCounts, subcategoriesForRegion } from "@/lib/exercises/filter"
import {
  DIFFICULTIES,
  EQUIPMENT,
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
  const subcategories = subcategoriesForRegion(filters.region)

  function update<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "region" ? { subcategory: "all" as const } : {}),
    }))
  }

  const tags: Array<{ key: string; label: string; onClear: () => void }> = []
  if (filters.region !== "all") {
    tags.push({
      key: "region",
      label: regionById(filters.region).label,
      onClear: () => update("region", "all"),
    })
  }
  if (filters.subcategory !== "all" && filters.region !== "all") {
    tags.push({
      key: "subcategory",
      label: subcategoryLabel(filters.region, filters.subcategory),
      onClear: () => update("subcategory", "all"),
    })
  }
  if (filters.difficulty !== "all") {
    tags.push({
      key: "difficulty",
      label: difficultyLabel(filters.difficulty),
      onClear: () => update("difficulty", "all"),
    })
  }
  if (filters.equipment !== "all") {
    tags.push({
      key: "equipment",
      label: equipmentLabel(filters.equipment),
      onClear: () => update("equipment", "all"),
    })
  }
  if (filters.position !== "all") {
    tags.push({
      key: "position",
      label: positionLabel(filters.position),
      onClear: () => update("position", "all"),
    })
  }

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
            onChange={(event) => update("query", event.target.value)}
            placeholder="Caută după titlu sau descriere…"
            className="h-12 w-full rounded-xl pl-11 text-base"
            aria-label="Caută exerciții"
          />
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-2 sm:shrink-0">
          <FilterSelect
            label="Regiuni"
            value={filters.region}
            onChange={(value) => update("region", value as AnatomicalRegion | "all")}
            options={[
              { id: "all", label: "Toate regiunile" },
              ...REGIONS.map((region) => ({ id: region.id, label: region.label })),
            ]}
          />
          <FilterSelect
            label="Obiectiv"
            value={filters.subcategory}
            disabled={filters.region === "all"}
            onChange={(value) => update("subcategory", value as TherapeuticObjective | "all")}
            options={[
              { id: "all", label: "Toate obiectivele" },
              ...subcategories.map((item) => ({ id: item.id, label: item.label })),
            ]}
          />
          <FilterSelect
            label="Nivel"
            value={filters.difficulty}
            onChange={(value) => update("difficulty", value as Difficulty | "all")}
            options={[{ id: "all", label: "Orice nivel" }, ...DIFFICULTIES]}
          />
          <FilterSelect
            label="Echipament"
            value={filters.equipment}
            onChange={(value) => update("equipment", value as Equipment | "all")}
            options={[{ id: "all", label: "Orice echipament" }, ...EQUIPMENT]}
          />
          <FilterSelect
            label="Poziție"
            value={filters.position}
            onChange={(value) => update("position", value as ExercisePosition | "all")}
            options={[{ id: "all", label: "Orice poziție" }, ...POSITIONS]}
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
            onClick={() => update("region", "all")}
            label="Toate"
            count={counts.all}
          />
          {REGIONS.map((region) => (
            <RegionPill
              key={region.id}
              active={filters.region === region.id}
              onClick={() => update("region", region.id)}
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
            onClick={() => setFilters(EMPTY_FILTERS)}
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
            <Button
              type="button"
              variant="outline"
              className="mt-4 h-11 rounded-xl"
              onClick={() => setFilters(EMPTY_FILTERS)}
            >
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
              onPreview={() => setPreview(exercise)}
              onAssign={() => setAssign(exercise)}
              onDelete={
                canModifyLibrary && exercise.custom
                  ? () => {
                      startDelete(async () => {
                        const result = await deleteLibraryExercise(exercise.id)
                        if (result.error) {
                          toast(result.error)
                          return
                        }
                        setExtras((current) => current.filter((item) => item.id !== exercise.id))
                        toast("Exercițiul a fost șters din bibliotecă.")
                      })
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {preview ? (
        <PreviewDialog
          exercise={preview}
          onClose={() => setPreview(null)}
          onAssign={() => {
            setAssign(preview)
            setPreview(null)
          }}
        />
      ) : null}
      {assign ? (
        <AssignDialog exercise={assign} patients={patients} onClose={() => setAssign(null)} />
      ) : null}
      {adding && canModifyLibrary ? (
        <AddExerciseDialog
          onClose={() => setAdding(false)}
          onCreated={(exercise) => setExtras((current) => [exercise, ...current])}
        />
      ) : null}
    </div>
  )
}

function FilterSelect({
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
        className="h-12 max-w-[11.5rem] min-w-[8.5rem] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:border-[#042f2e] focus-visible:ring-3 focus-visible:ring-[#042f2e]/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
      >
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function RegionPill({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
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
}
