"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { ChevronDown, Plus, Search, SlidersHorizontal } from "lucide-react"

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
import { DIFFICULTIES, EQUIPMENT, POSITIONS, REGIONS } from "@/lib/exercises/taxonomy"
import type { AssignablePatient, LibraryExercise, LibraryFilters } from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

function Pill({
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
        "h-9 shrink-0 rounded-full border px-3 text-sm font-medium transition",
        active
          ? "border-[#042f2e] bg-[#042f2e] text-white"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      {children}
    </button>
  )
}

function FilterRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
      <p className="w-28 shrink-0 pt-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <div className="flex min-w-0 flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function ExerciseLibrary({ patients }: { patients: AssignablePatient[] }) {
  const [custom, setCustom] = useState<LibraryExercise[]>([])
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [preview, setPreview] = useState<LibraryExercise | null>(null)
  const [assign, setAssign] = useState<LibraryExercise | null>(null)
  const [adding, setAdding] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)

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
  const advancedCount = [filters.difficulty, filters.equipment, filters.position].filter((value) => value !== "all")
    .length

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

  return (
    <div className="flex max-w-full flex-col gap-6 overflow-x-hidden">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Bibliotecă Exerciții</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-600">
            Catalog clinic după regiune anatomică și obiectiv terapeutic. Caută, filtrează și asignează direct pe fișa
            pacientului.
          </p>
        </div>
        <Button type="button" onClick={() => setAdding(true)} className="h-12 min-h-[48px] rounded-xl px-4">
          <Plus className="size-4" />
          Adaugă Exercițiu
        </Button>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
        <Input
          value={filters.query}
          onChange={(event) => update("query", event.target.value)}
          placeholder="Caută după titlu sau descriere…"
          className="h-12 rounded-xl pl-11 text-base"
          aria-label="Caută exerciții"
        />
      </div>

      <div className="flex flex-col gap-4">
        <div
          role="tablist"
          aria-label="Regiune anatomică"
          className="max-w-full overflow-x-auto whitespace-nowrap scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex w-max gap-1">
          <Tab
            active={filters.region === "all"}
            onClick={() => update("region", "all")}
            label={`Toate (${counts.all})`}
          />
          {REGIONS.map((region) => (
            <Tab
              key={region.id}
              active={filters.region === region.id}
              onClick={() => update("region", region.id)}
              label={`${region.label} (${counts[region.id]})`}
            />
          ))}
          </div>
        </div>

        {subcategories.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Obiectiv terapeutic</p>
            <div className="mt-2 flex max-w-full flex-wrap gap-2">
              <Pill active={filters.subcategory === "all"} onClick={() => update("subcategory", "all")}>
                Toate
              </Pill>
              {subcategories.map((item) => (
                <Pill
                  key={item.id}
                  active={filters.subcategory === item.id}
                  onClick={() => update("subcategory", item.id)}
                >
                  {item.label}
                </Pill>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => setAdvancedOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            aria-expanded={advancedOpen}
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <SlidersHorizontal className="size-4 text-slate-500" />
              Filtre avansate
              {advancedCount > 0 ? (
                <span className="rounded-full bg-[#042f2e] px-2 py-0.5 text-[11px] font-medium text-white">
                  {advancedCount}
                </span>
              ) : null}
            </span>
            <ChevronDown className={cn("size-4 text-slate-400 transition", advancedOpen && "rotate-180")} />
          </button>
          {advancedOpen ? (
            <div className="flex flex-col gap-4 border-t border-slate-100 px-4 py-4">
              <FilterRow label="Nivel">
                {DIFFICULTIES.map((item) => (
                  <Pill
                    key={item.id}
                    active={filters.difficulty === item.id}
                    onClick={() => toggle("difficulty", item.id)}
                  >
                    {item.label}
                  </Pill>
                ))}
              </FilterRow>
              <FilterRow label="Echipament">
                {EQUIPMENT.map((item) => (
                  <Pill
                    key={item.id}
                    active={filters.equipment === item.id}
                    onClick={() => toggle("equipment", item.id)}
                  >
                    {item.label}
                  </Pill>
                ))}
              </FilterRow>
              <FilterRow label="Poziție">
                {POSITIONS.map((item) => (
                  <Pill
                    key={item.id}
                    active={filters.position === item.id}
                    onClick={() => toggle("position", item.id)}
                  >
                    {item.label}
                  </Pill>
                ))}
              </FilterRow>
            </div>
          ) : null}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
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

function Tab({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 rounded-full px-4 text-sm font-medium whitespace-nowrap transition",
        active ? "bg-[#042f2e] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
      )}
    >
      {label}
    </button>
  )
}
