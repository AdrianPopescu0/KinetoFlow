import type { Metadata } from "next"

import { AddPatientDialog } from "@/app/dashboard/add-patient-dialog"
import { DashboardOverview } from "@/app/dashboard/dashboard-overview"
import { listTherapistPatients } from "@/lib/patients/queries"

export const metadata: Metadata = {
  title: "Dashboard | KinetoFlow",
}

export default async function DashboardPage() {
  const { patients, stats, error, needsMigration } = await listTherapistPatients()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Panoul terapeutului</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitorizează recuperarea, alertele VAS și linkurile de acces.
          </p>
        </div>
        <AddPatientDialog />
      </div>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-800" role="alert">
          {error}
          {needsMigration ? (
            <span className="mt-2 block text-slate-600">
              Rulează `supabase/migrations/001_patients.sql` în SQL Editor.
            </span>
          ) : null}
        </section>
      ) : (
        <DashboardOverview patients={patients} stats={stats} />
      )}
    </main>
  )
}
