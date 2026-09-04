"use client"

import { useEffect, useState, useSyncExternalStore, useTransition } from "react"

import { submitPatientCheckin } from "@/app/dashboard/patients/actions"
import { AppShell } from "@/components/brand/app-atmosphere"
import { CheckinSuccess } from "@/components/patient/checkin-success"
import { DailyCheckinForm } from "@/components/patient/daily-checkin-form"
import { ExerciseCard } from "@/components/patient/exercise-card"
import { ExtraTipsDialog, RecoveryDrawer, RecoveryGuidePanel } from "@/components/patient/recovery-guide-panel"
import { PatientHeader } from "@/components/patient/patient-header"
import { PatientOnboardingModal } from "@/components/patient/patient-onboarding-modal"
import { TherapistSupportColumn } from "@/components/patient/therapist-support-column"
import { isPatientUuidToken } from "@/lib/patients/session"
import { formatRomanianDate, todayInBucharest } from "@/lib/patients/program"
import {
  loadCompletedExercisesSnapshot,
  loadTodaysCheckin,
  saveCompletedExercises,
  saveTodaysCheckin,
  subscribePatientStorage,
} from "@/lib/patients/storage"
import type { DailyCheckin, EnergyLevel, PatientProgram, SleepQuality } from "@/lib/patients/types"
import { toast } from "@/components/ui/toaster"

function mergeIds(...lists: Array<string[] | undefined>): string[] {
  return Array.from(new Set(lists.flatMap((list) => list ?? []).filter(Boolean)))
}

export function PatientPortal({ program }: { program: PatientProgram }) {
  const localDate = todayInBucharest()
  const dateLabel = formatRomanianDate()
  const canPersistToServer = isPatientUuidToken(program.token)

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

  const [completedIds, setCompletedIds] = useState<string[]>(() =>
    mergeIds(program.completedExerciseIdsToday),
  )
  const [pendingExerciseId, setPendingExerciseId] = useState<string | null>(null)
  const [justSubmitted, setJustSubmitted] = useState(false)
  const [pain, setPain] = useState(3)
  const [sleep, setSleep] = useState<SleepQuality | null>(null)
  const [energy, setEnergy] = useState<EnergyLevel | null>(null)
  const [notes, setNotes] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const [guideOpen, setGuideOpen] = useState(false)
  const [tipsOpen, setTipsOpen] = useState(false)

  // Hidratează din localStorage + server după mount.
  useEffect(() => {
    const local = loadCompletedExercisesSnapshot(program.token, localDate)
      .split("|")
      .filter(Boolean)
    const merged = mergeIds(local, program.completedExerciseIdsToday)
    setCompletedIds(merged)
    if (merged.length > 0) {
      saveCompletedExercises(program.token, localDate, merged)
    }
  }, [localDate, program.completedExerciseIdsToday, program.token])

  async function toggleExercise(exerciseId: string, completed: boolean) {
    const previous = completedIds
    const next = completed
      ? mergeIds(completedIds, [exerciseId])
      : completedIds.filter((id) => id !== exerciseId)

    // Feedback vizual imediat.
    setCompletedIds(next)
    setPendingExerciseId(exerciseId)
    saveCompletedExercises(program.token, localDate, next)

    if (!canPersistToServer) {
      setPendingExerciseId(null)
      toast(completed ? "Marcat ca efectuat (demo)." : "Marcaj anulat (demo).")
      return
    }

    try {
      const response = await fetch("/api/patient/exercise-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: program.token,
          exerciseId,
          completed,
          localDate,
          patientId: program.patientId ?? null,
        }),
      })

      const payload = (await response.json().catch(() => null)) as {
        error?: string
        completedIds?: string[]
      } | null

      if (!response.ok || payload?.error) {
        const message = payload?.error || `Salvare eșuată (HTTP ${response.status}).`
        console.error("[Marchează ca Efectuat]", message, {
          exerciseId,
          localDate,
          token: program.token,
          patientId: program.patientId,
        })
        setCompletedIds(previous)
        saveCompletedExercises(program.token, localDate, previous)
        toast(message)
        return
      }

      if (Array.isArray(payload?.completedIds)) {
        setCompletedIds(payload.completedIds)
        saveCompletedExercises(program.token, localDate, payload.completedIds)
      }

      toast(completed ? "Exercițiu marcat ca efectuat." : "Marcaj anulat.")
    } catch (err) {
      console.error("[Marchează ca Efectuat] network/error", err)
      setCompletedIds(previous)
      saveCompletedExercises(program.token, localDate, previous)
      toast("Nu am putut salva. Verifică conexiunea și încearcă din nou.")
    } finally {
      setPendingExerciseId(null)
    }
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
      formData.set("completedExerciseIds", completedIds.join("|"))
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

      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 py-6 pb-16 lg:px-6">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-8">
          {/* Coloana stângă — terapeut + reguli */}
          <aside className="order-2 w-full shrink-0 lg:sticky lg:top-24 lg:order-1 lg:w-1/3 lg:max-w-sm">
            <TherapistSupportColumn
              therapistName={program.therapistName}
              therapistPhone={program.therapistPhone}
            />
          </aside>

          {/* Coloana dreaptă — check-in, ghid, exerciții */}
          <div className="order-1 flex min-w-0 flex-1 flex-col gap-8 lg:order-2 lg:w-2/3">
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

            <div className="hidden lg:block">
              <RecoveryGuidePanel onReadMore={() => setTipsOpen(true)} />
            </div>

            <section className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-800">Exercițiile de azi</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Urmărește video-ul, apoi marchează-le ca efectuate.
                </p>
              </div>

              {program.exercises.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600 shadow-sm">
                  Terapeutul nu a alocat încă exerciții. Completează totuși check-in-ul.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
                  {program.exercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      completed={completedIds.includes(exercise.id)}
                      pending={pendingExerciseId === exercise.id}
                      onToggle={toggleExercise}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Ghid educațional pe mobil, sub exerciții */}
            <div className="lg:hidden">
              <RecoveryGuidePanel onReadMore={() => setTipsOpen(true)} />
            </div>
          </div>
        </div>
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
