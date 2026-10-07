"use client"

import { memo } from "react"

import {
  DIFFICULTIES,
  EQUIPMENT,
  OBJECTIVES,
  POSITIONS,
  REGIONS,
} from "@/lib/exercises/taxonomy"
import type {
  AnatomicalRegion,
  Difficulty,
  Equipment,
  ExercisePosition,
  LibraryFilters,
  TherapeuticObjective,
} from "@/lib/exercises/types"
import { cn } from "@/lib/utils"

export const REGION_FILTER_OPTIONS = [
  { id: "all", label: "Toate regiunile" },
  ...REGIONS.map((region) => ({ id: region.id, label: region.label })),
]
export const OBJECTIVE_FILTER_OPTIONS = [{ id: "all", label: "Toate obiectivele" }, ...OBJECTIVES]
export const DIFFICULTY_FILTER_OPTIONS = [{ id: "all", label: "Orice nivel" }, ...DIFFICULTIES]
export const EQUIPMENT_FILTER_OPTIONS = [{ id: "all", label: "Orice echipament" }, ...EQUIPMENT]
export const POSITION_FILTER_OPTIONS = [{ id: "all", label: "Orice poziție" }, ...POSITIONS]

const FilterSelect = memo(function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; label: string }>
  className?: string
}) {
  return (
    <label className="flex min-w-0 flex-col">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        aria-label={label}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          "h-11 max-w-[16.5rem] min-w-[8.5rem] rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus-visible:border-[#042f2e] focus-visible:ring-3 focus-visible:ring-[#042f2e]/20",
          className,
        )}
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

export function LibraryQuickFilters({
  filters,
  onChange,
  className,
}: {
  filters: Pick<LibraryFilters, "region" | "subcategory" | "difficulty" | "equipment" | "position">
  onChange: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void
  className?: string
}) {
  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      <FilterSelect
        label="Regiuni"
        value={filters.region}
        onChange={(value) => onChange("region", value as AnatomicalRegion | "all")}
        options={REGION_FILTER_OPTIONS}
      />
      <FilterSelect
        label="Obiectiv"
        value={filters.subcategory}
        onChange={(value) => onChange("subcategory", value as TherapeuticObjective | "all")}
        options={OBJECTIVE_FILTER_OPTIONS}
      />
      <FilterSelect
        label="Nivel"
        value={filters.difficulty}
        onChange={(value) => onChange("difficulty", value as Difficulty | "all")}
        options={DIFFICULTY_FILTER_OPTIONS}
      />
      <FilterSelect
        label="Echipament"
        value={filters.equipment}
        onChange={(value) => onChange("equipment", value as Equipment | "all")}
        options={EQUIPMENT_FILTER_OPTIONS}
      />
      <FilterSelect
        label="Poziție"
        value={filters.position}
        onChange={(value) => onChange("position", value as ExercisePosition | "all")}
        options={POSITION_FILTER_OPTIONS}
      />
    </div>
  )
}
