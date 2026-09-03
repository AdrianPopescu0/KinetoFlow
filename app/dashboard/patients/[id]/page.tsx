import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { CopyAccessLink } from "@/app/dashboard/patients/copy-access-link"
import { ClinicalNotesEditor } from "@/app/dashboard/patients/clinical-notes-editor"
import { ExerciseManager } from "@/app/dashboard/patients/exercise-manager"
import { PatientFileActions } from "@/app/dashboard/patients/patient-file-actions"
import { PatientFileStampProvider } from "@/app/dashboard/patients/patient-file-stamp"
import { VasChart } from "@/app/dashboard/patients/vas-chart"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { sleepLabel } from "@/lib/patients/display"
import { getTherapistPatient } from "@/lib/patients/queries"

type PatientFilePageProps = {
  params: Promise<{ id: string }>
}

export default async function PatientFilePage({ params }: PatientFilePageProps) {
  const { id } = await params
  const { patient, exercises, checkIns, error } = await getTherapistPatient(id)
  if (!patient) {
    notFound()
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <Link href="/dashboard" prefetch className="inline-flex items-center gap-1 text-sm font-medium text-[#042f2e]">
          <ArrowLeft className="size-4" />
          Înapoi la dashboard
        </Link>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        <PatientFileStampProvider initialUpdatedAt={patient.updated_at}>
        <section className={surfaceCardClassName("p-5")}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">Fișa pacientului</p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-800">{patient.full_name}</h1>
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium text-slate-800">Diagnostic:</span> {patient.diagnosis || "—"}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {patient.email || "Fără email"} · {patient.phone || "Fără telefon"}
              </p>
              {patient.access_code ? (
                <p className="mt-2 font-mono text-lg font-semibold tracking-[0.18em] text-slate-900">
                  Cod acces: {patient.access_code}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyAccessLink token={patient.token} />
              <PatientFileActions patient={patient} />
            </div>
          </div>
        </section>

        <section className={surfaceCardClassName("p-5")}>
          <h2 className="text-base font-semibold text-slate-800">Notițe clinice</h2>
          <p className="mt-1 text-sm text-slate-600">
            Fișa de tratament se salvează automat în draft local la fiecare 5 secunde, apoi pe server când ești gata.
          </p>
          <div className="mt-4">
            <ClinicalNotesEditor patientId={patient.id} serverNotes={patient.clinical_notes} />
          </div>
        </section>
        </PatientFileStampProvider>

        <section className={surfaceCardClassName("overflow-hidden")}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-800">Exerciții prescrise</h2>
            <p className="text-sm text-slate-600">Adaugă video YouTube sau MP4, serii, repetări și instrucțiuni.</p>
          </div>
          <ExerciseManager patientId={patient.id} exercises={exercises} />
        </section>

        <section className={surfaceCardClassName("overflow-hidden")}>
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-base font-semibold text-slate-800">Monitorizare clinică</h2>
            <p className="text-sm text-slate-600">Evoluția scorului VAS și istoricul check-in-urilor zilnice.</p>
          </div>
          <VasChart checkIns={checkIns} />
          <div className="overflow-x-auto border-t border-slate-200">
            {checkIns.length === 0 ? (
              <p className="px-5 py-6 text-sm text-slate-600">Niciun check-in înregistrat.</p>
            ) : (
              <table className="w-full min-w-[40rem] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  <tr>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3">Durere</th>
                    <th className="px-5 py-3">Somn</th>
                    <th className="px-5 py-3">Tip durere</th>
                    <th className="px-5 py-3">Comentarii</th>
                  </tr>
                </thead>
                <tbody>
                  {checkIns.map((row) => (
                    <tr key={row.id} className="border-t border-slate-100">
                      <td className="px-5 py-3 text-slate-700">
                        {new Date(row.created_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}
                      </td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{row.vas_score}/10</td>
                      <td className="px-5 py-3">{sleepLabel(row.sleep_quality)}</td>
                      <td className="px-5 py-3">{row.pain_type || "—"}</td>
                      <td className="px-5 py-3 text-slate-600">{row.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
  )
}
