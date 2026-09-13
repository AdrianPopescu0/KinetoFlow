import { DashboardOverview } from "@/app/dashboard/dashboard-overview"
import { getCachedUser } from "@/lib/auth/session"
import { listClinicTherapistOptions } from "@/lib/clinics/members"
import { listTherapistPatients } from "@/lib/patients/queries"

export async function DashboardData() {
  const { supabase, user } = await getCachedUser()

  const [{ patients, stats, error, needsMigration }, therapists] = await Promise.all([
    listTherapistPatients(),
    user ? listClinicTherapistOptions(supabase, user) : Promise.resolve([]),
  ])

  if (error) {
    return (
      <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-800" role="alert">
        {error}
        {needsMigration ? (
          <span className="mt-2 block text-slate-600">
            Rulează `supabase/migrations/001_patients.sql` în SQL Editor.
          </span>
        ) : null}
      </section>
    )
  }

  return (
    <DashboardOverview
      patients={patients}
      stats={stats}
      currentTherapistId={user?.id ?? ""}
      therapists={therapists}
    />
  )
}
