"use client"

import { useState, useSyncExternalStore, useTransition } from "react"

import { submitPatientCheckin } from "@/app/dashboard/patients/actions"
import { AppShell } from "@/components/brand/app-atmosphere"
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
import type { DailyCheckin, PatientProgram, SleepQuality } from "@/lib/patients/types"

export function PatientPortal({ program }: { program: PatientProgram }) {
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
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function toggleExercise(exerciseId: string, completed: boolean) {
    const next = completed
      ? Array.from(new Set([...completedIds, exerciseId]))
      : completedIds.filter((id) => id !== exerciseId)
    saveCompletedExercises(program.token, localDate, next)
  }

  function submitCheckin() {
    setError(null)
    if (sleep === null) {
      setError("Alege calitatea somnului ca să trimiți check-in-ul.")
      return
    }

    startTransition(async () => {
      const payload: DailyCheckin = {
        submittedAt: new Date().toISOString(),
        localDate,
        pain,
        sleep,
        painKind: null,
        notes: notes.trim(),
        completedExerciseIds: completedIds,
      }

      const formData = new FormData()
      formData.set("token", program.token)
      formData.set("vas", String(pain))
      formData.set("sleep", sleep)
      formData.set("notes", notes.trim())
      await submitPatientCheckin(formData)

      saveTodaysCheckin(program.token, payload)
      setJustSubmitted(true)
    })
  }

  return (
    <AppShell>
      <PatientHeader firstName={program.firstName} dateLabel={dateLabel} />

      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 py-6 pb-16">
        {!isClient ? (
          <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
        ) : storedCheckin ? (
          <CheckinSuccess checkin={storedCheckin} alreadySubmitted={!justSubmitted} />
        ) : (
          <DailyCheckinForm
            pain={pain}
            sleep={sleep}
            notes={notes}
            error={error}
            pending={pending}
            onPainChange={setPain}
            onSleepChange={setSleep}
            onNotesChange={setNotes}
            onSubmit={submitCheckin}
          />
        )}

        <section className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-800">Exercițiile de azi</h2>
            <p className="mt-1 text-sm text-slate-600">Urmărește video-ul, apoi marchează-le ca efectuate.</p>
          </div>
          {program.exercises.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
              Terapeutul nu a alocat încă exerciții. Completează totuși check-in-ul.
            </p>
          ) : (
            program.exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                completed={completedIds.includes(exercise.id)}
                onToggle={toggleExercise}
              />
            ))
          )}
        </section>
      </main>
    </AppShell>
  )
}
