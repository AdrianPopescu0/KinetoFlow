import { ExerciseLibrary } from "@/app/dashboard/exercises/exercise-library"
import { getCachedUser } from "@/lib/auth/session"
import { authUserCanEditLibrary } from "@/lib/exercises/library-admin"
import { listStoredLibraryExercises } from "@/lib/exercises/library-store"
import { listTherapistPatientSummaries } from "@/lib/patients/queries"

export async function ExercisesData() {
  const [{ user }, patients, storedExercises] = await Promise.all([
    getCachedUser(),
    listTherapistPatientSummaries(),
    listStoredLibraryExercises(),
  ])

  return (
    <ExerciseLibrary
      patients={patients}
      storedExercises={storedExercises}
      canEditLibrary={authUserCanEditLibrary(user)}
      viewerEmail={user?.email ?? null}
    />
  )
}
