import type { Metadata } from "next"
import { Suspense } from "react"

import { ExercisesData } from "@/app/dashboard/exercises/exercises-data"
import { ExercisesLibrarySkeleton } from "@/app/dashboard/exercises/exercises-skeleton"

export const metadata: Metadata = {
  title: "Bibliotecă Exerciții | KinetoFlow",
}

export default function ExercisesPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-hidden px-5 py-8">
      <Suspense fallback={<ExercisesLibrarySkeleton />}>
        <ExercisesData />
      </Suspense>
    </main>
  )
}
