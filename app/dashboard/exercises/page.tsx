import type { Metadata } from "next"

import { ExerciseLibrary } from "@/app/dashboard/exercises/exercise-library"
import { getCachedUser } from "@/lib/auth/session"
import { isExerciseLibraryEditor } from "@/lib/exercises/library-admin"
import { listStoredLibraryExercises } from "@/lib/exercises/library-store"
import { listTherapistPatientSummaries } from "@/lib/patients/queries"

export const metadata: Metadata = {
  title: "Bibliotecă Exerciții | KinetoFlow",
}

export default async function ExercisesPage() {
  const [{ user }, patients, storedExercises] = await Promise.all([
    getCachedUser(),
    listTherapistPatientSummaries(),
    listStoredLibraryExercises(),
  ])

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-hidden px-5 py-8">
      <ExerciseLibrary
        patients={patients}
        storedExercises={storedExercises}
        canEditLibrary={isExerciseLibraryEditor(user?.email)}
      />
    </main>
  )
}
