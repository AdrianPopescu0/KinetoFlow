import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { RestoreArchivedPatientButton } from "@/app/dashboard/arhiva/restore-archived-patient-button"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { getCachedUser } from "@/lib/auth/session"
import {
  ARCHIVE_LOCKED_MESSAGE,
  fetchClinicSubscription,
  isClinicSubscriptionActive,
} from "@/lib/clinics/subscription"
import { listArchivedClinicPatients } from "@/lib/patients/queries"

export const metadata: Metadata = {
  title: "Arhiva Clinicii | KinetoFlow",
}

function formatArchivedOn(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }
  return date.toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default async function ClinicArchivePage() {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    redirect("/login")
  }

  const subscription = await fetchClinicSubscription(supabase, user.id)
  const subscriptionActive = isClinicSubscriptionActive(subscription.startsAt, subscription.endsAt)

  if (!subscriptionActive) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">Arhivă</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800">Arhiva Clinicii</h1>
        </div>
        <section className={surfaceCardClassName("p-5")}>
          <p className="text-sm text-slate-600">{ARCHIVE_LOCKED_MESSAGE}</p>
        </section>
      </main>
    )
  }

  const { patients, error } = await listArchivedClinicPatients()

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">Arhivă</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800">Arhiva Clinicii</h1>
        <p className="mt-1 text-sm text-slate-600">
          Pacienții arhivați dispar din lista activă, dar fișa și datele rămân disponibile aici.
        </p>
      </div>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <section className={surfaceCardClassName("overflow-hidden")}>
        {patients.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-sm font-medium text-slate-800">Nu există pacienți arhivați.</p>
            <p className="mt-1 text-sm text-slate-600">
              Când arhivezi un pacient din fișa lui, apare aici și iese din dashboard-ul activ.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Nume</th>
                  <th className="px-5 py-3">Diagnostic</th>
                  <th className="px-5 py-3">Arhivat la</th>
                  <th className="px-5 py-3 text-right">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/patients/${patient.id}`}
                        prefetch
                        className="font-medium text-[#042f2e] hover:underline"
                      >
                        {patient.fullName}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{patient.diagnosis || "—"}</td>
                    <td className="px-5 py-3 text-slate-600">{formatArchivedOn(patient.archivedAt)}</td>
                    <td className="px-5 py-3 text-right">
                      <RestoreArchivedPatientButton patientId={patient.id} patientName={patient.fullName} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
