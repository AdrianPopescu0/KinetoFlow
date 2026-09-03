"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { Check, Copy, FolderOpen, Plus, Search } from "lucide-react"

import { AssignExercisesModal } from "@/app/dashboard/assign-exercises-modal"
import { AssignedTherapistSelect } from "@/app/dashboard/assigned-therapist-select"
import { assignPatientTherapist } from "@/app/dashboard/patients/actions"
import { toast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ClinicTherapistOption } from "@/lib/clinics/types"
import {
  emptyAssignmentScopeMessage,
  emptyFilterMessage,
  PATIENT_SCOPE_STORAGE_KEY,
  patientMatchesAssignmentScope,
  patientMatchesListFilter,
  type PatientAssignmentScope,
  type PatientListFilter,
} from "@/lib/patients/dashboard-filter"
import { patientAccessUrl, vasBadgeClass } from "@/lib/patients/display"
import type { PatientListItem } from "@/lib/patients/types-db"
import { cn } from "@/lib/utils"

export function PatientList({
  patients,
  filter,
  currentTherapistId,
  therapists,
}: {
  patients: PatientListItem[]
  filter: PatientListFilter
  currentTherapistId: string
  therapists: ClinicTherapistOption[]
}) {
  const [query, setQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [scope, setScope] = useState<PatientAssignmentScope>("mine")
  const [assignments, setAssignments] = useState<Record<string, string | null>>({})
  const [source, setSource] = useState(patients)
  const [exerciseTarget, setExerciseTarget] = useState<{ id: string; name: string } | null>(null)
  const [, startAssign] = useTransition()

  // Datele proaspete de pe server înlocuiesc suprascrierile optimiste.
  if (source !== patients) {
    setSource(patients)
    setAssignments({})
  }

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(PATIENT_SCOPE_STORAGE_KEY)
      if (stored === "mine" || stored === "clinic") {
        setScope(stored)
      }
    } catch {
      // ignore
    }
  }, [])

  function selectScope(next: PatientAssignmentScope) {
    setScope(next)
    try {
      window.localStorage.setItem(PATIENT_SCOPE_STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }

  const rows = useMemo(
    () =>
      patients.map((patient) =>
        patient.id in assignments
          ? { ...patient, assigned_therapist_id: assignments[patient.id] }
          : patient,
      ),
    [assignments, patients],
  )

  function assignTherapist(patientId: string, previous: string | null, next: string | null) {
    setAssignments((current) => ({ ...current, [patientId]: next }))

    startAssign(async () => {
      const result = await assignPatientTherapist(patientId, next)
      if (result.error) {
        setAssignments((current) => ({ ...current, [patientId]: previous }))
        toast(result.error)
        return
      }
      const name = therapists.find((therapist) => therapist.user_id === next)?.therapist_name
      toast(name ? `Pacientul a fost asignat lui ${name}.` : "Pacientul este neasignat / la comun.")
    })
  }

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return rows.filter((patient) => {
      if (!patientMatchesAssignmentScope(patient, scope, currentTherapistId)) {
        return false
      }
      const haystack = `${patient.full_name} ${patient.diagnosis ?? ""} ${patient.email ?? ""} ${patient.phone ?? ""} ${patient.access_code ?? ""}`.toLowerCase()
      if (needle && !haystack.includes(needle)) {
        return false
      }
      return patientMatchesListFilter(patient, filter)
    })
  }, [currentTherapistId, filter, query, rows, scope])

  async function copyLink(patient: PatientListItem) {
    await navigator.clipboard.writeText(patientAccessUrl(patient.token))
    setCopiedId(patient.id)
    toast("Linkul de acces a fost copiat.")
    window.setTimeout(() => {
      setCopiedId((current) => (current === patient.id ? null : current))
    }, 2000)
  }

  return (
    <div>
      <div className="border-b border-slate-200 px-5 py-4">
        <div
          className="mb-3 inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto"
          role="tablist"
          aria-label="Vizualizare pacienți"
        >
          <button
            type="button"
            role="tab"
            aria-selected={scope === "mine"}
            onClick={() => selectScope("mine")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
              scope === "mine" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Pacienții mei
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={scope === "clinic"}
            onClick={() => selectScope("clinic")}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors sm:flex-none",
              scope === "clinic" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900",
            )}
          >
            Toți pacienții cabinetului
          </button>
        </div>
        <div className="relative w-full">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după nume, diagnostic sau email"
            className="h-11 w-full border-slate-300 pl-9"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-600">
          {query.trim()
            ? "Nu am găsit pacienți pentru filtrul selectat."
            : filter !== "all"
              ? emptyFilterMessage(filter)
              : emptyAssignmentScopeMessage(scope)}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Pacient</th>
                <th className="px-5 py-3">Diagnostic</th>
                <th className="px-5 py-3">Ultimul VAS</th>
                <th className="px-5 py-3">Terapeut responsabil</th>
                <th className="px-5 py-3 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((patient) => (
                <tr key={patient.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-5 py-4">
                    <p className="font-medium text-slate-800">{patient.full_name}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{patient.email || patient.phone || "—"}</p>
                  </td>
                  <td className="px-5 py-4 text-slate-700">{patient.diagnosis || "—"}</td>
                  <td className="px-5 py-4">
                    <span
                      className={cn(
                        "inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                        vasBadgeClass(patient.lastVas),
                      )}
                    >
                      {patient.lastVas === null ? "Fără scor" : `VAS ${patient.lastVas}`}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <AssignedTherapistSelect
                      assignedTherapistId={patient.assigned_therapist_id}
                      therapists={therapists}
                      onSelect={(next) =>
                        assignTherapist(patient.id, patient.assigned_therapist_id, next)
                      }
                    />
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyLink(patient)}
                        className="h-11 min-h-[44px] rounded-xl"
                      >
                        {copiedId === patient.id ? <Check className="size-4" /> : <Copy className="size-4" />}
                        Copiază Link Acces
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setExerciseTarget({ id: patient.id, name: patient.full_name })}
                        className="h-11 min-h-[44px] rounded-xl"
                      >
                        <Plus className="size-4" />
                        Exerciții
                      </Button>
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        prefetch
                        className="inline-flex h-11 min-h-[44px] items-center gap-1.5 rounded-xl bg-[#042f2e] px-3 text-sm font-medium text-white hover:bg-[#064e3b]"
                      >
                        <FolderOpen className="size-4" />
                        Deschide Fișa
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AssignExercisesModal
        open={Boolean(exerciseTarget)}
        patientId={exerciseTarget?.id ?? ""}
        patientName={exerciseTarget?.name ?? ""}
        onClose={() => setExerciseTarget(null)}
      />
    </div>
  )
}
