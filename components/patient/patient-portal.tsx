"use client"

import { useState, useSyncExternalStore, useTransition } from "react"

import { AppAtmosphere } from "@/components/brand/app-atmosphere"
import { CheckinSuccess } from "@/components/patient/checkin-success"
import { DailyCheckinForm } from "@/components/patient/daily-checkin-form"
import { ExerciseCard } from "@/components/patient/exercise-card"
import { PatientHeader } from "@/components/patient/patient-header"
import { formatRomanianDate, todayInBucharest } from "@/lib/patients/program"
import {
  loadCompletedExercisesSnapshot,
  loadTodaysCheckin,
  saveCompletedExercises,
  saveTodaysCheckin,
  subscribePatientStorage,
} from "@/lib/patients/storage"
import type { DailyCheckin, PainKind, PatientProgram, SleepQuality } from "@/lib/patients/types"

type PatientPortalProps = {
  program: PatientProgram
}

export function PatientPortal({ program }: PatientPortalProps) {
  const localDate = todayInBucharest()
  const dateLabel = formatRomanianDate()

  const isClient = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  )
  const storedCheckin = useSyncExternalStore(
    subscribePatientStorage,
    () => loadTodaysCheckin(program.token, localDate),
    () => null,
  )
  const storedCompleted = useSyncExternalStore(
    subscribePatientStorage,
    () => loadCompletedExercisesSnapshot(program.token, localDate),
    () => "",
  )
  const completedIds = storedCompleted.length > 0 ? storedCompleted.split("|") : []

  const [justSubmitted, setJustSubmitted] = useState(false)
  const [pain, setPain] = useState(3)
  const [sleep, setSleep] = useState<SleepQuality | null>(null)
  const [painKind, setPainKind] = useState<PainKind | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggleExercise(exerciseId: string, completed: boolean) {
    if (storedCheckin) {
      return
    }

    const next = completed
      ? Array.from(new Set([...completedIds, exerciseId]))
      : completedIds.filter((id) => id !== exerciseId)

    saveCompletedExercises(program.token, localDate, next)
  }

  function submitCheckin() {
    setError(null)

    if (sleep === null || painKind === null) {
      setError("Completează somnul și tipul durerii ca să trimiți check-in-ul.")
      return
    }

    startTransition(() => {
      const payload: DailyCheckin = {
        submittedAt: new Date().toISOString(),
        localDate,
        pain,
        sleep,
        painKind,
        notes: notes.trim(),
        completedExerciseIds: completedIds,
      }
      saveTodaysCheckin(program.token, payload)
      setJustSubmitted(true)
    })
  }

  return (
    <AppAtmosphere>
      <PatientHeader
        firstName={program.firstName}
        dateLabel={dateLabel}
        progressPercent={program.progressPercent}
        programLabel={program.programLabel}
      />

      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-6 pb-16">
        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-white">
              Exercițiile tale de azi
            </h2>
            <p className="mt-1 text-sm text-emerald-100/70">
              Urmărește demonstrația, apoi bifează ce ai terminat.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            {program.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                completed={completedIds.includes(exercise.id)}
                locked={Boolean(storedCheckin)}
                onToggle={toggleExercise}
              />
            ))}
          </div>
        </section>

        {!isClient ? (
          <div
            className="h-80 animate-pulse rounded-2xl border border-white/10 bg-white/5"
            aria-hidden="true"
          />
        ) : storedCheckin ? (
          <CheckinSuccess checkin={storedCheckin} alreadySubmitted={!justSubmitted} />
        ) : (
          <DailyCheckinForm
            pain={pain}
            sleep={sleep}
            painKind={painKind}
            notes={notes}
            error={error}
            pending={pending}
            onPainChange={setPain}
            onSleepChange={setSleep}
            onPainKindChange={setPainKind}
            onNotesChange={setNotes}
            onSubmit={submitCheckin}
          />
        )}
      </main>
    </AppAtmosphere>
  )
}
