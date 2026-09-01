"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { PatientRecord } from "@/lib/patients/types-db"

function patientLink(token: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/p/${token}`
  }
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  return `${siteUrl.replace(/\/$/, "")}/p/${token}`
}

export function PatientList({ patients }: { patients: PatientRecord[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copyLink(patient: PatientRecord) {
    const url = patientLink(patient.token)
    await navigator.clipboard.writeText(url)
    setCopiedId(patient.id)
    window.setTimeout(() => {
      setCopiedId((current) => (current === patient.id ? null : current))
    }, 2000)
  }

  if (patients.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate-600">
        Nu ai încă pacienți activi. Adaugă primul pacient ca să generezi linkul de acces.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
          <tr>
            <th className="px-5 py-3">Pacient</th>
            <th className="px-5 py-3">Diagnostic</th>
            <th className="px-5 py-3">Contact</th>
            <th className="px-5 py-3 text-right">Acces</th>
          </tr>
        </thead>
        <tbody>
          {patients.map((patient) => (
            <tr key={patient.id} className="border-b border-slate-100 last:border-0">
              <td className="px-5 py-4">
                <p className="font-medium text-slate-800">{patient.full_name}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {new Date(patient.created_at).toLocaleDateString("ro-RO")}
                </p>
              </td>
              <td className="px-5 py-4 text-slate-700">{patient.diagnosis || "—"}</td>
              <td className="px-5 py-4 text-slate-600">
                <p>{patient.email || "—"}</p>
                <p className="text-xs">{patient.phone || ""}</p>
              </td>
              <td className="px-5 py-4 text-right">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => copyLink(patient)}
                  className="h-11 min-h-[44px] rounded-xl"
                >
                  {copiedId === patient.id ? (
                    <>
                      <Check className="size-4" />
                      Copiat
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copiază link pacient
                    </>
                  )}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
