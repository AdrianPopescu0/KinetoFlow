import { ExercisesLibrarySkeleton } from "@/app/dashboard/exercises/exercises-skeleton"

export default function ExercisesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-5 py-8">
      <ExercisesLibrarySkeleton />
    </div>
  )
}
