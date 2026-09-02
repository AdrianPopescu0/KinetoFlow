import type { Metadata } from "next"

import { ExerciseLibrary } from "@/app/dashboard/exercises/exercise-library"
import { listTherapistPatientSummaries } from "@/lib/patients/queries"

export const metadata: Metadata = {
  title: "Bibliotecă Exerciții | KinetoFlow",
}

export default async function ExercisesPage() {
  const patients = await listTherapistPatientSummaries()

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-hidden px-5 py-8">
      <ExerciseLibrary patients={patients} />
    </main>
  )
}
