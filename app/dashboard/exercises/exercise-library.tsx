"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  Bone,
  Footprints,
  Hand,
  PersonStanding,
  Plus,
  Search,
} from "lucide-react"

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
} from "@/lib/exercises/taxonomy"
import type { AssignablePatient, LibraryExercise, LibraryFilters } from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

const REGION_ICONS = {
  cervical: Bone,
  lumbar: PersonStanding,
  upper: Hand,
  lower: Footprints,
  functional: Activity,
} as const

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

export function ExerciseLibrary({ patients }: { patients: AssignablePatient[] }) {
  const [custom, setCustom] = useState<LibraryExercise[]>([])
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [preview, setPreview] = useState<LibraryExercise | null>(null)
  const [assign, setAssign] = useState<LibraryExercise | null>(null)
  const [adding, setAdding] = useState(false)

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
    <div className="flex flex-col gap-6">
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

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        <button
          type="button"
          onClick={() => update("region", "all")}
          className={cn(
            "flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
            filters.region === "all"
              ? "border-[#042f2e] bg-[#042f2e] text-white"
              : "border-slate-200 bg-white text-slate-700",
          )}
        >
          Toate
          <span className={cn("rounded-full px-1.5 text-xs", filters.region === "all" ? "bg-white/15" : "bg-slate-100")}>
            {counts.all}
          </span>
        </button>
        {REGIONS.map((region) => {
          const Icon = REGION_ICONS[region.id]
          const active = filters.region === region.id
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => update("region", region.id)}
              className={cn(
                "flex h-12 shrink-0 items-center gap-2 rounded-xl border px-3 text-sm font-medium",
                active ? "border-[#042f2e] bg-[#042f2e] text-white" : "border-slate-200 bg-white text-slate-700",
              )}
            >
              <Icon className="size-4 opacity-80" />
              <span className="whitespace-nowrap">{region.shortLabel}</span>
              <span className={cn("rounded-full px-1.5 text-xs tabular-nums", active ? "bg-white/15" : "bg-slate-100")}>
                {counts[region.id]}
              </span>
            </button>
          )
        })}
      </div>

      {subcategories.length > 0 ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Obiectiv terapeutic</p>
          <div className="flex flex-wrap gap-2">
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

      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Filtre rapide</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((item) => (
            <Pill
              key={item.id}
              active={filters.difficulty === item.id}
              onClick={() => toggle("difficulty", item.id)}
            >
              {item.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((item) => (
            <Pill key={item.id} active={filters.equipment === item.id} onClick={() => toggle("equipment", item.id)}>
              {item.label}
            </Pill>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {POSITIONS.map((item) => (
            <Pill key={item.id} active={filters.position === item.id} onClick={() => toggle("position", item.id)}>
              {item.label}
            </Pill>
          ))}
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
