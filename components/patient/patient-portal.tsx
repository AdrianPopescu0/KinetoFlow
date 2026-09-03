"use client"

import { useState, useSyncExternalStore, useTransition } from "react"

import { submitPatientCheckin } from "@/app/dashboard/patients/actions"
import { AppShell } from "@/components/brand/app-atmosphere"
import { CheckinSuccess } from "@/components/patient/checkin-success"
import { DailyCheckinForm } from "@/components/patient/daily-checkin-form"
import { ExerciseCard } from "@/components/patient/exercise-card"
import { ExtraTipsDialog, RecoveryDrawer, RecoveryGuidePanel } from "@/components/patient/recovery-guide-panel"
import { PatientHeader } from "@/components/patient/patient-header"
import { PatientOnboardingModal } from "@/components/patient/patient-onboarding-modal"
import { TherapistSupportColumn } from "@/components/patient/therapist-support-column"
import { formatRomanianDate, todayInBucharest } from "@/lib/patients/program"
import {
  loadCompletedExercisesSnapshot,
  loadTodaysCheckin,
  saveCompletedExercises,
  saveTodaysCheckin,
  subscribePatientStorage,
} from "@/lib/patients/storage"
import type { DailyCheckin, EnergyLevel, PatientProgram, SleepQuality } from "@/lib/patients/types"

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
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [guideOpen, setGuideOpen] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)

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
      const vasScore = Number.parseInt(String(pain), 10)
      if (!Number.isInteger(vasScore) || vasScore < 0 || vasScore > 10) {
        setError("Alege un scor de durere între 0 și 10.")
        return
      }

      const payload: DailyCheckin = {
        submittedAt: new Date().toISOString(),
        localDate,
        pain: vasScore,
        sleep,
        painKind: null,
        energy,
        notes: notes.trim(),
        completedExerciseIds: completedIds,
      }

      const formData = new FormData()
      formData.set("token", program.token)
      formData.set("vas", String(vasScore))
      formData.set("sleep", sleep)
      if (energy) {
        formData.set("energy", energy)
      }
      formData.set("notes", notes.trim())
      const result = await submitPatientCheckin(formData)
      if (result.error) {
        setError(result.error)
        return
      }

      saveTodaysCheckin(program.token, payload)
      setJustSubmitted(true)
    })
  }

  return (
    <AppShell>
      <PatientOnboardingModal patientKey={program.token} />
      <PatientHeader firstName={program.firstName} dateLabel={dateLabel} onOpenGuide={() => setGuideOpen(true)} />

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 overflow-x-hidden px-4 py-6 pb-16 lg:grid-cols-[minmax(240px,280px)_minmax(0,1fr)_minmax(260px,320px)] lg:items-start lg:px-6">
        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <TherapistSupportColumn therapistName={program.therapistName} therapistPhone={program.therapistPhone} />
        </aside>

        <div className="flex min-w-0 flex-col gap-8">
          {!isClient ? (
            <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white" />
          ) : storedCheckin ? (
            <CheckinSuccess checkin={storedCheckin} alreadySubmitted={!justSubmitted} />
          ) : (
            <DailyCheckinForm
              pain={pain}
              sleep={sleep}
              energy={energy}
              notes={notes}
              error={error}
              pending={pending}
              onPainChange={setPain}
              onSleepChange={setSleep}
              onEnergyChange={setEnergy}
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
        </div>

        <aside className="hidden lg:sticky lg:top-24 lg:block">
          <RecoveryGuidePanel onReadMore={() => setTipsOpen(true)} />
        </aside>
      </main>

      {guideOpen ? (
        <RecoveryDrawer title="Ghid recuperare" onClose={() => setGuideOpen(false)}>
          <TherapistSupportColumn therapistName={program.therapistName} therapistPhone={program.therapistPhone} />
          <RecoveryGuidePanel
            onReadMore={() => {
              setGuideOpen(false)
              setTipsOpen(true)
            }}
          />
        </RecoveryDrawer>
      ) : null}
      {tipsOpen ? <ExtraTipsDialog onClose={() => setTipsOpen(false)} /> : null}
    </AppShell>
  )
}
