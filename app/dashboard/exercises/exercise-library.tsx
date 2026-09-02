"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, Plus, Search, X } from "lucide-react"

import { LibraryCard } from "@/app/dashboard/exercises/library-card"
import {
  AddExerciseDialog,
  AssignDialog,
  PreviewDialog,
} from "@/app/dashboard/exercises/library-dialogs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { LIBRARY_EXERCISES } from "@/lib/exercises/catalog"
import { loadCustomExercises, saveCustomExercises } from "@/lib/exercises/extras"
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
import type { AssignablePatient, LibraryExercise, LibraryFilters } from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

export function ExerciseLibrary({ patients }: { patients: AssignablePatient[] }) {
  const [custom, setCustom] = useState<LibraryExercise[]>([])
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [preview, setPreview] = useState<LibraryExercise | null>(null)
  const [assign, setAssign] = useState<LibraryExercise | null>(null)
  const [adding, setAdding] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)

  useEffect(() => {
    setCustom(loadCustomExercises())
  }, [])

  const catalog = useMemo(() => [...custom, ...LIBRARY_EXERCISES], [custom])
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
  const extraFilterCount = [
    filters.subcategory,
    filters.difficulty,
    filters.equipment,
    filters.position,
  ].filter((value) => value !== "all").length

  function update<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value,
      ...(key === "region" ? { subcategory: "all" as const } : {}),
    }))
  }

  function toggle<T extends string>(key: "difficulty" | "equipment" | "position", value: T) {
    setFilters((current) => ({
      ...current,
      [key]: current[key] === value ? "all" : value,
    }))
  }

  function addCustom(exercise: LibraryExercise) {
    setCustom((current) => {
      const next = [exercise, ...current]
      saveCustomExercises(next)
      return next
    })
    setFilters((current) => ({ ...current, region: exercise.region, subcategory: "all" }))
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
    <div className="flex max-w-full flex-col gap-6 overflow-x-hidden">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bibliotecă Exerciții</h1>
        <p className="mt-1 max-w-xl text-sm text-slate-600">
          Catalog clinic după regiune anatomică și obiectiv terapeutic. Caută, filtrează și asignează direct pe fișa
          pacientului.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="w-full shrink-0 lg:sticky lg:top-4 lg:w-[260px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <p className="px-2 pt-1 text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Regiuni anatomice
            </p>
            <nav aria-label="Regiuni anatomice" className="mt-2 flex flex-col">
              <RegionLink
                active={filters.region === "all"}
                label="Toate"
                count={counts.all}
                onClick={() => update("region", "all")}
              />
              {REGIONS.map((region) => (
                <RegionLink
                  key={region.id}
                  active={filters.region === region.id}
                  label={region.label}
                  count={counts[region.id]}
                  onClick={() => update("region", region.id)}
                />
              ))}
            </nav>

            <div className="mt-3 border-t border-slate-100 pt-2">
              <button
                type="button"
                onClick={() => setFiltersOpen((open) => !open)}
                className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-xs font-semibold tracking-wide text-slate-400 uppercase"
                aria-expanded={filtersOpen}
              >
                <span>
                  Filtre rapide
                  {extraFilterCount > 0 ? (
                    <span className="ml-2 rounded-full bg-[#042f2e] px-1.5 py-0.5 text-[10px] font-medium text-white normal-case">
                      {extraFilterCount}
                    </span>
                  ) : null}
                </span>
                <ChevronDown className={cn("size-4 text-slate-400 transition", filtersOpen && "rotate-180")} />
              </button>

              {filtersOpen ? (
                <div className="flex flex-col gap-4 px-1 pb-2">
                  {subcategories.length > 0 ? (
                    <SidebarGroup label="Obiectiv terapeutic">
                      <SidebarOption
                        active={filters.subcategory === "all"}
                        onClick={() => update("subcategory", "all")}
                      >
                        Toate
                      </SidebarOption>
                      {subcategories.map((item) => (
                        <SidebarOption
                          key={item.id}
                          active={filters.subcategory === item.id}
                          onClick={() => update("subcategory", item.id)}
                        >
                          {item.label}
                        </SidebarOption>
                      ))}
                    </SidebarGroup>
                  ) : (
                    <p className="px-1 text-xs leading-relaxed text-slate-400">
                      Alege o regiune pentru obiectivele terapeutice.
                    </p>
                  )}
                  <SidebarGroup label="Nivel">
                    {DIFFICULTIES.map((item) => (
                      <SidebarOption
                        key={item.id}
                        active={filters.difficulty === item.id}
                        onClick={() => toggle("difficulty", item.id)}
                      >
                        {item.label}
                      </SidebarOption>
                    ))}
                  </SidebarGroup>
                  <SidebarGroup label="Echipament">
                    {EQUIPMENT.map((item) => (
                      <SidebarOption
                        key={item.id}
                        active={filters.equipment === item.id}
                        onClick={() => toggle("equipment", item.id)}
                      >
                        {item.label}
                      </SidebarOption>
                    ))}
                  </SidebarGroup>
                  <SidebarGroup label="Poziție">
                    {POSITIONS.map((item) => (
                      <SidebarOption
                        key={item.id}
                        active={filters.position === item.id}
                        onClick={() => toggle("position", item.id)}
                      >
                        {item.label}
                      </SidebarOption>
                    ))}
                  </SidebarGroup>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={filters.query}
                onChange={(event) => update("query", event.target.value)}
                placeholder="Caută după titlu sau descriere…"
                className="h-12 rounded-xl pl-11 text-base"
                aria-label="Caută exerciții"
              />
            </div>
            <Button
              type="button"
              onClick={() => setAdding(true)}
              className="h-12 min-h-[48px] shrink-0 rounded-xl px-4"
            >
              <Plus className="size-4" />
              Adaugă Exercițiu
            </Button>
          </div>

          {tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
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
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((exercise) => (
                <LibraryCard
                  key={exercise.id}
                  exercise={exercise}
                  onPreview={() => setPreview(exercise)}
                  onAssign={() => setAssign(exercise)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

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
      {adding ? <AddExerciseDialog onClose={() => setAdding(false)} onCreated={addCustom} /> : null}
    </div>
  )
}

function RegionLink({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean
  label: string
  count: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm transition",
        active
          ? "bg-teal-50 font-medium text-[#042f2e]"
          : "font-normal text-slate-700 hover:bg-slate-50 hover:text-slate-900",
      )}
    >
      <span className="min-w-0 leading-snug">{label}</span>
      <span className={cn("tabular-nums text-xs", active ? "text-teal-800" : "text-slate-400")}>{count}</span>
    </button>
  )
}

function SidebarGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-1 text-[11px] font-semibold tracking-wide text-slate-400 uppercase">{label}</p>
      <div className="mt-1 flex flex-col">{children}</div>
    </div>
  )
}

function SidebarOption({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md px-1 py-1.5 text-left text-sm leading-snug",
        active ? "font-medium text-[#042f2e]" : "text-slate-600 hover:text-slate-900",
      )}
    >
      {children}
    </button>
  )
}
