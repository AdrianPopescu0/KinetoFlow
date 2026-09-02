import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/app/dashboard/dashboard-header"
import { ExerciseLibrary } from "@/app/dashboard/exercises/exercise-library"
import { AppShell } from "@/components/brand/app-atmosphere"
import { listTherapistPatients } from "@/lib/patients/queries"
import { createClient } from "@/utils/supabase/server"

export const metadata: Metadata = {
  title: "Bibliotecă Exerciții | KinetoFlow",
}

export default async function ExercisesPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { patients } = await listTherapistPatients()
  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined

  return (
    <AppShell>
      <DashboardHeader email={user.email} metadataName={metadataName} current="exercises" />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-hidden px-5 py-8">
        <ExerciseLibrary
          patients={patients.map((patient) => ({
            id: patient.id,
            fullName: patient.full_name,
            diagnosis: patient.diagnosis,
          }))}
        />
      </main>
    </AppShell>
  )
}
