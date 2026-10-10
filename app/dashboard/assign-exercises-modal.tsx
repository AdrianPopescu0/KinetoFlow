"use client"

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { Check, Loader2, Search } from "lucide-react"

import {
  assignExercisesBatch,
  listAssignablePatients,
  listAssignedExercisesForPatient,
} from "@/app/dashboard/patients/actions"
import { DoseCountInput } from "@/components/exercises/dose-count-input"
import { LibraryQuickFilters } from "@/components/exercises/library-quick-filters"
import { useAssignLibrary } from "@/components/exercises/assign-library-provider"
import { Button } from "@/components/ui/button"
import { CenteredModal } from "@/components/ui/centered-modal"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import {
  librarySelectionForAssignedInterval,
  preferredTreatmentInterval,
  type AssignedProgramExercise,
} from "@/lib/exercises/assigned-selection"
import { doseCountDraft, parseDoseCount } from "@/lib/exercises/dose-input"
import { EMPTY_FILTERS, filterLibrary } from "@/lib/exercises/filter"
import { formatTreatmentInterval } from "@/lib/exercises/schedule"
import { regionById } from "@/lib/exercises/taxonomy"
import type { LibraryExercise, LibraryFilters } from "@/lib/exercises/types"
import { PATIENT_ADVICE_MAX_LENGTH } from "@/lib/patients/patient-advice"
import { cn } from "@/lib/utils"

type Dose = { sets: string; reps: string }

function doseDraftFromCounts(sets: number, reps: number): Dose {
  return { sets: doseCountDraft(sets), reps: doseCountDraft(reps) }
}

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

function dosesFromSelection(selection: { doses: Record<string, { sets: number; reps: number }> }): Record<string, Dose> {
  return Object.fromEntries(
    Object.entries(selection.doses).map(([id, dose]) => [id, doseDraftFromCounts(dose.sets, dose.reps)]),
  )
}

export type AssignPatientOption = {
  id: string
  name: string
}

const patientSelectClassName = cn(
  "h-11 w-full min-w-0 rounded-xl border px-3 text-sm font-medium outline-none",
  "border-slate-300 bg-white text-slate-800",
  "focus-visible:border-[#042f2e] focus-visible:ring-2 focus-visible:ring-[#042f2e]/20",
  "dark:border-[var(--kf-border)] dark:bg-slate-900 dark:text-slate-100",
  "dark:focus-visible:border-teal-400 dark:focus-visible:ring-teal-400/25",
  "disabled:cursor-wait disabled:opacity-70",
)

export function AssignExercisesModal({
  patientId,
  patientName,
  patients: patientsProp,
  open,
  onClose,
  onSaved,
  onPatientChange,
  initialAssigned,
  initialPatientMessage,
}: {
  patientId: string
  patientName: string
  patients?: AssignPatientOption[]
  open: boolean
  onClose: () => void
  onSaved?: () => void
  onPatientChange?: (patientId: string, patientName: string) => void
  initialAssigned?: AssignedProgramExercise[]
  initialPatientMessage?: string
}) {
  const [activeId, setActiveId] = useState(patientId)
  const [activeName, setActiveName] = useState(patientName)
  const [assigned, setAssigned] = useState<AssignedProgramExercise[]>(initialAssigned ?? [])
  const [patientMessage, setPatientMessage] = useState(initialPatientMessage ?? "")
  const [options, setOptions] = useState<AssignPatientOption[]>(patientsProp ?? [])
  const [switching, setSwitching] = useState(false)
  const openGeneration = useRef(0)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false
      return
    }
    // Doar la deschidere: schimbarea internă a pacientului nu trebuie să șteargă planul încărcat.
    const justOpened = !wasOpenRef.current
    wasOpenRef.current = true
    if (!justOpened) {
      return
    }
    setActiveId(patientId)
    setActiveName(patientName)
    setAssigned(initialAssigned ?? [])
    setPatientMessage(initialPatientMessage ?? "")
    setSwitching(false)
  }, [open, patientId, patientName, initialAssigned, initialPatientMessage])

  useEffect(() => {
    if (!open) {
      return
    }
    if (patientsProp && patientsProp.length > 0) {
      setOptions(patientsProp)
      return
    }

    const generation = ++openGeneration.current
    void listAssignablePatients().then((result) => {
      if (openGeneration.current !== generation) {
        return
      }
      if (result.error) {
        console.error("[AssignExercisesModal] listAssignablePatients:", result.error)
        setOptions([{ id: patientId, name: patientName }])
        return
      }
      const next = result.patients
      if (!next.some((item) => item.id === patientId) && patientId) {
        setOptions([{ id: patientId, name: patientName }, ...next])
        return
      }
      setOptions(next)
    })
  }, [open, patientId, patientName, patientsProp])

  const selectOptions = useMemo(() => {
    if (options.some((item) => item.id === activeId) || !activeId) {
      return options
    }
    return [{ id: activeId, name: activeName }, ...options]
  }, [activeId, activeName, options])

  const changePatient = useCallback(
    async (nextId: string) => {
      if (!nextId || nextId === activeId || switching) {
        return
      }
      const option = selectOptions.find((item) => item.id === nextId)
      if (!option) {
        return
      }

      setSwitching(true)
      const result = await listAssignedExercisesForPatient(option.id)
      if (result.error) {
        toast(result.error)
        setSwitching(false)
        return
      }

      setActiveId(option.id)
      setActiveName(option.name)
      setAssigned(result.exercises)
      setPatientMessage(result.patientMessage)
      onPatientChange?.(option.id, option.name)
      setSwitching(false)
    },
    [activeId, onPatientChange, selectOptions, switching],
  )

  if (!open) {
    return null
  }

  return (
    <AssignExercisesModalContent
      key={activeId}
      patientId={activeId}
      patientName={activeName}
      onClose={onClose}
      onSaved={onSaved}
      initialAssigned={assigned}
      initialPatientMessage={patientMessage}
      patientPicker={
        selectOptions.length > 0 ? (
          <label className="flex min-w-0 flex-col gap-1.5">
            <span className="flex items-center justify-between gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              Pacient
              {switching ? (
                <span className="inline-flex items-center gap-1 font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                  Se încarcă…
                </span>
              ) : null}
            </span>
            <select
              value={activeId}
              disabled={switching}
              onChange={(event) => void changePatient(event.target.value)}
              className={patientSelectClassName}
              aria-label="Selectează pacientul pentru atribuire"
            >
              {selectOptions.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </label>
        ) : null
      }
    />
  )
}

function AssignExercisesModalContent({
  patientId,
  patientName,
  onClose,
  onSaved,
  initialAssigned,
  initialPatientMessage,
  patientPicker,
}: {
  patientId: string
  patientName: string
  onClose: () => void
  onSaved?: () => void
  initialAssigned: AssignedProgramExercise[]
  initialPatientMessage: string
  patientPicker?: ReactNode
}) {
  const { catalog: libraryCatalog, protocols } = useAssignLibrary()
  const [sessionExtras, setSessionExtras] = useState<LibraryExercise[]>([])
  const catalog = useMemo(() => {
    if (sessionExtras.length === 0) {
      return libraryCatalog
    }
    const ids = new Set(libraryCatalog.map((item) => item.id))
    return [...libraryCatalog, ...sessionExtras.filter((item) => !ids.has(item.id))]
  }, [libraryCatalog, sessionExtras])

  const fallbackInterval = intervalFromToday(7)
  const openingInterval = preferredTreatmentInterval(
    initialAssigned,
    fallbackInterval,
    localDateKey(new Date()),
  )
  const openingSelection = librarySelectionForAssignedInterval(
    catalog,
    initialAssigned,
    openingInterval,
  )

  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<LibraryFilters>(EMPTY_FILTERS)
  const [startDate, setStartDate] = useState(openingInterval.startDate)
  const [endDate, setEndDate] = useState(openingInterval.endDate)
  const [datesTouched, setDatesTouched] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>(openingSelection.selectedIds)
  const [doses, setDoses] = useState<Record<string, Dose>>(() => dosesFromSelection(openingSelection))
  const [isPending, startTransition] = useTransition()
  const [patientMessage, setPatientMessage] = useState(initialPatientMessage)
  const [appliedProtocolId, setAppliedProtocolId] = useState("")
  const selectionModeRef = useRef<"auto" | "manual">("auto")

  // Remapează selecția doar local când se schimbă intervalul — fără rețea.
  useEffect(() => {
    if (!datesTouched) {
      const preferred = preferredTreatmentInterval(
        initialAssigned,
        intervalFromToday(7),
        localDateKey(new Date()),
      )
      if (preferred.startDate !== startDate || preferred.endDate !== endDate) {
        setStartDate(preferred.startDate)
        setEndDate(preferred.endDate)
        return
      }
    }
    if (selectionModeRef.current === "manual") {
      return
    }
    const selection = librarySelectionForAssignedInterval(catalog, initialAssigned, { startDate, endDate })
    setSelectedIds(selection.selectedIds)
    setDoses((current) => ({
      ...current,
      ...dosesFromSelection(selection),
    }))
  }, [catalog, datesTouched, endDate, initialAssigned, startDate])

  const updateFilter = useCallback(<K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }))
  }, [])

  const filtered = useMemo(
    () => filterLibrary(catalog, { ...filters, query }),
    [catalog, filters, query],
  )

  const intervalValid = Boolean(startDate && endDate && startDate <= endDate)
  const intervalLabel = intervalValid ? formatTreatmentInterval(startDate, endDate) : "interval invalid"

  const toggleExercise = useCallback((id: string) => {
    selectionModeRef.current = "manual"
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }, [])

  const updateDose = useCallback((id: string, field: keyof Dose, raw: string) => {
    setDoses((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { sets: "0", reps: "0" }), [field]: raw },
    }))
  }, [])

  const applyProtocol = useCallback(
    (protocolId: string) => {
      setAppliedProtocolId(protocolId)
      if (!protocolId) {
        selectionModeRef.current = "auto"
        return
      }
      const protocol = protocols.find((item) => item.id === protocolId)
      if (!protocol || protocol.exercises.length === 0) {
        toast("Protocolul nu are exerciții.")
        return
      }

      selectionModeRef.current = "manual"

      const nextIds: string[] = []
      const nextDoses: Record<string, Dose> = {}
      const missing: string[] = []
      const extras: LibraryExercise[] = []

      for (const item of protocol.exercises) {
        const byId = item.libraryExerciseId
          ? catalog.find((exercise) => exercise.id === item.libraryExerciseId)
          : undefined
        const byTitle = catalog.find(
          (exercise) =>
            exercise.title.trim().toLocaleLowerCase("ro-RO") === item.title.trim().toLocaleLowerCase("ro-RO"),
        )
        const matched = byId ?? byTitle
        if (matched) {
          nextIds.push(matched.id)
          nextDoses[matched.id] = doseDraftFromCounts(item.sets ?? matched.sets, item.reps ?? matched.reps)
          continue
        }

        const fallbackId = item.libraryExerciseId || `protocol-${protocol.id}-${item.id}`
        extras.push({
          id: fallbackId,
          title: item.title,
          description: item.description ?? "",
          region: "lumbar",
          regions: ["lumbar"],
          subcategory: "mobility",
          objectives: ["mobility"],
          difficulty: "usor",
          equipment: "none",
          equipments: ["none"],
          position: "sitting",
          sets: item.sets ?? 3,
          reps: item.reps ?? 10,
          durationSeconds: 90,
          youtubeId: null,
          videoUrl: item.videoUrl,
          custom: true,
        })
        nextIds.push(fallbackId)
        nextDoses[fallbackId] = doseDraftFromCounts(item.sets ?? 3, item.reps ?? 10)
        missing.push(item.title)
      }

      if (extras.length > 0) {
        setSessionExtras((current) => {
          const ids = new Set(current.map((item) => item.id))
          return [...current, ...extras.filter((item) => !ids.has(item.id))]
        })
      }

      setSelectedIds((current) => [...new Set([...current, ...nextIds])])
      setDoses((current) => ({ ...current, ...nextDoses }))
      toast(
        missing.length > 0
          ? `Protocol aplicat (${nextIds.length} exerciții). Unele nu erau în catalogul curent și au fost adăugate din șablon.`
          : `Protocol „${protocol.title}” aplicat — ${nextIds.length} exerciții selectate.`,
      )
    },
    [catalog, protocols],
  )

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
        sets: parseDoseCount(doses[exercise.id]?.sets ?? doseCountDraft(exercise.sets)),
        reps: parseDoseCount(doses[exercise.id]?.reps ?? doseCountDraft(exercise.reps)),
        description: exercise.description,
      }))

    startTransition(async () => {
      const result = await assignExercisesBatch(patientId, exercises, {
        startDate,
        endDate,
        patientMessage,
      })
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
    <CenteredModal
      wide
      title={`Atribuie exerciții — ${patientName}`}
      titleId="assign-exercises-title"
      headerExtra={patientPicker}
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {selectedIds.length} {selectedIds.length === 1 ? "exercițiu selectat" : "exerciții selectate"}{" "}
            pentru intervalul{" "}
            <span className="font-semibold text-slate-800 dark:text-slate-100">{intervalLabel}</span>.
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
        </div>
      }
    >
      <div className="space-y-4">
        <section>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
            Protocol predefinit
          </p>
          <select
            value={appliedProtocolId}
            onChange={(event) => applyProtocol(event.target.value)}
            disabled={isPending}
            className={patientSelectClassName}
            aria-label="Alege un protocol predefinit"
          >
            <option value="">
              {protocols.length === 0
                ? "Niciun protocol în bibliotecă"
                : "Alege un protocol — imporți toate exercițiile"}
            </option>
            {protocols.map((protocol) => (
              <option key={protocol.id} value={protocol.id}>
                {protocol.title} ({protocol.exercises.length}{" "}
                {protocol.exercises.length === 1 ? "exercițiu" : "exerciții"})
              </option>
            ))}
          </select>
        </section>

        <section>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">Perioadă de tratament</p>
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

        <label className="flex flex-col gap-1.5 text-xs font-medium text-slate-600">
          Mesaj sau sfat pentru pacient
          <Textarea
            value={patientMessage}
            onChange={(event) => setPatientMessage(event.target.value.slice(0, PATIENT_ADVICE_MAX_LENGTH))}
            rows={2}
            maxLength={PATIENT_ADVICE_MAX_LENGTH}
            disabled={isPending}
            placeholder="Recomandări kinetoterapeut — pacientul le vede la „Kinetoterapeutul tău”."
            className="min-h-[4rem] resize-y text-base md:text-sm"
          />
        </label>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută exerciții după titlu sau regiune"
            className="h-11 min-h-11 border-slate-300 pl-9 text-base md:text-sm"
          />
        </div>

        <LibraryQuickFilters filters={filters} onChange={updateFilter} />

        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-slate-500">
              Niciun exercițiu nu corespunde filtrelor.
            </li>
          ) : (
            filtered.map((exercise) => {
              const dose = doses[exercise.id] ?? doseDraftFromCounts(exercise.sets, exercise.reps)
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
    </CenteredModal>
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
  sets: string
  reps: string
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
          Serii
          <DoseCountInput
            value={sets}
            onValueChange={(next) => onDoseChange(exercise.id, "sets", next)}
            className="mt-0.5 h-11 min-h-11 px-2 text-center text-base md:h-9 md:min-h-9 md:text-sm"
          />
        </label>
        <label
          className="text-xs font-medium text-slate-500"
          onClick={(event) => event.stopPropagation()}
          onPointerDown={(event) => event.stopPropagation()}
        >
          Repetări
          <DoseCountInput
            value={reps}
            onValueChange={(next) => onDoseChange(exercise.id, "reps", next)}
            className="mt-0.5 h-11 min-h-11 px-2 text-center text-base md:h-9 md:min-h-9 md:text-sm"
          />
        </label>
      </div>
    </li>
  )
})
