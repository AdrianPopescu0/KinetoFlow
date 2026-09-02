"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Check, Copy, FolderOpen, Search } from "lucide-react"

import { toast } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { emptyFilterMessage, patientMatchesListFilter, type PatientListFilter } from "@/lib/patients/dashboard-filter"
import { patientAccessUrl, vasBadgeClass } from "@/lib/patients/display"
import type { PatientListItem } from "@/lib/patients/types-db"
import { cn } from "@/lib/utils"

export function PatientList({
  patients,
  filter,
}: {
  patients: PatientListItem[]
  filter: PatientListFilter
}) {
  const [query, setQuery] = useState("")
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return patients.filter((patient) => {
      const haystack = `${patient.full_name} ${patient.diagnosis ?? ""} ${patient.email ?? ""} ${patient.phone ?? ""} ${patient.access_code ?? ""}`.toLowerCase()
      if (needle && !haystack.includes(needle)) {
        return false
      }
      return patientMatchesListFilter(patient, filter)
    })
  }, [filter, patients, query])

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
          {query.trim() ? "Nu am găsit pacienți pentru filtrul selectat." : emptyFilterMessage(filter)}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Pacient</th>
                <th className="px-5 py-3">Diagnostic</th>
                <th className="px-5 py-3">Ultimul VAS</th>
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
    </div>
  )
}
