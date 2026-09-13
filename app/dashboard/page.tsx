import type { Metadata } from "next"
import { Suspense } from "react"

import { AddPatientDialog } from "@/app/dashboard/add-patient-dialog"
import { DashboardData } from "@/app/dashboard/dashboard-data"
import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { OnboardingTour } from "@/components/dashboard/onboarding-tour"
import { getCachedUser } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Dashboard | KinetoFlow",
}

export default async function DashboardPage() {
  const { user } = await getCachedUser()
  const currentTherapistId = user?.id ?? ""

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-6xl flex-1 flex-col gap-6 overflow-x-hidden px-5 py-8">
      {currentTherapistId ? <OnboardingTour userId={currentTherapistId} /> : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Panoul terapeutului</h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitorizează recuperarea, alertele VAS și linkurile de acces.
          </p>
        </div>
        <AddPatientDialog />
      </div>

      <Suspense fallback={<DashboardOverviewSkeleton />}>
        <DashboardData />
      </Suspense>
    </main>
  )
}
