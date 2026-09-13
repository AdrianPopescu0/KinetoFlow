"use client"

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition } from "react"

import { submitPatientCheckin } from "@/app/dashboard/patients/actions"
import { AppShell } from "@/components/brand/app-atmosphere"
import { PatientThemeProvider } from "@/components/theme/dashboard-theme"
import { CheckinSuccess } from "@/components/patient/checkin-success"
import { ConnectionBanner } from "@/components/patient/connection-banner"
import { DailyCheckinForm } from "@/components/patient/daily-checkin-form"
import { ExerciseCard } from "@/components/patient/exercise-card"
import { ExercisesCompleteCelebration } from "@/components/patient/exercises-complete-celebration"
import { ExtraTipsDialog, RecoveryDrawer, RecoveryGuidePanel } from "@/components/patient/recovery-guide-panel"
import { PatientHeader } from "@/components/patient/patient-header"
import { PatientOnboardingModal } from "@/components/patient/patient-onboarding-modal"
import { PatientPushListener } from "@/components/patient/patient-push-listener"
import { PatientPushOnboarding } from "@/components/patient/patient-push-onboarding"
import {
  GoldenRulesCard,
  TherapistCard,
  TherapistSupportColumn,
} from "@/components/patient/therapist-support-column"
import { isPatientUuidToken } from "@/lib/patients/session"
import { formatRomanianDate, todayInBucharest } from "@/lib/patients/program"
import {
  allExercisesCompleted,
  CHECKIN_REQUIRES_EXERCISES_MESSAGE,
} from "@/lib/patients/checkin-exercises"
import { isBrowserOnline, isLikelyOfflineError, subscribeOnlineStatus } from "@/lib/patients/connection"
import {
  clearCheckinDraft,
  clearExercisesPendingSync,
  hasExercisesPendingSync,
  loadCheckinDraft,
  loadCompletedExercisesSnapshot,
  loadSessionStartedAt,
  loadTodaysCheckin,
  markExercisesPendingSync,
  markSessionStarted,
  saveCheckinDraft,
  saveCompletedExercises,
  saveTodaysCheckin,
  subscribePatientStorage,
} from "@/lib/patients/storage"
import { computeExerciseDurationSeconds } from "@/lib/patients/session-duration"
import type { DailyCheckin, EnergyLevel, PatientProgram, SleepQuality } from "@/lib/patients/types"
import { EXERCISES_COMPLETE_MESSAGE, OFFLINE_CHECKIN_MESSAGE, OFFLINE_EXERCISE_TOAST } from "@/lib/patients/ux-copy"
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
  const [errorTone, setErrorTone] = useState<"error" | "offline">("error")
  const [justReconnected, setJustReconnected] = useState(false)
  const [celebrateAnimate, setCelebrateAnimate] = useState(false)
  const [draftReady, setDraftReady] = useState(false)
  const wasOfflineRef = useRef(false)
  const prevExercisesComplete = useRef<boolean | null>(null)

  const online = useSyncExternalStore(subscribeOnlineStatus, isBrowserOnline, () => true)

  const exerciseIds = program.exercises.map((exercise) => exercise.id)
  const exercisesDone = exerciseIds.filter((id) => completedIds.includes(id)).length
  const exercisesComplete = allExercisesCompleted(exerciseIds, completedIds)
  const submitEnabled = exercisesComplete && pendingExerciseId === null
  const showCelebration = exercisesComplete && exerciseIds.length > 0

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
    if (program.todaysCheckin) {
      saveTodaysCheckin(program.token, {
        ...program.todaysCheckin,
        completedExerciseIds: mergeIds(
          program.todaysCheckin.completedExerciseIds,
          program.completedExerciseIdsToday,
          merged,
        ),
      })
    } else {
      const draft = loadCheckinDraft(program.token, localDate)
      if (draft) {
        setPain(draft.pain)
        setSleep(draft.sleep)
        setEnergy(draft.energy)
        setNotes(draft.notes)
      }
    }
    setDraftReady(true)
  }, [localDate, program.completedExerciseIdsToday, program.todaysCheckin, program.token])

  useEffect(() => {
    if (!draftReady || storedCheckin) {
      return
    }
    saveCheckinDraft(program.token, localDate, { pain, sleep, energy, notes })
  }, [draftReady, energy, localDate, notes, pain, program.token, sleep, storedCheckin])

  useEffect(() => {
    if (!online) {
      wasOfflineRef.current = true
      setJustReconnected(false)
      return
    }
    if (!wasOfflineRef.current) {
      return
    }
    wasOfflineRef.current = false
    setJustReconnected(true)
    const timer = window.setTimeout(() => setJustReconnected(false), 4000)
    return () => window.clearTimeout(timer)
  }, [online])

  useEffect(() => {
    if (prevExercisesComplete.current === null) {
      prevExercisesComplete.current = showCelebration
      return
    }
    if (showCelebration && !prevExercisesComplete.current) {
      setCelebrateAnimate(true)
      toast(EXERCISES_COMPLETE_MESSAGE)
    }
    prevExercisesComplete.current = showCelebration
  }, [showCelebration])

  useEffect(() => {
    if (!online || !canPersistToServer || !hasExercisesPendingSync(program.token, localDate)) {
      return
    }
    let cancelled = false
    const ids = loadCompletedExercisesSnapshot(program.token, localDate)
      .split("|")
      .filter(Boolean)

    void (async () => {
      for (const exerciseId of ids) {
        if (cancelled) {
          return
        }
        try {
          const response = await fetch("/api/patient/exercise-completion", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              token: program.token,
              exerciseId,
              completed: true,
              localDate,
              patientId: program.patientId ?? null,
            }),
          })
          if (!response.ok) {
            return
          }
        } catch {
          return
        }
      }
      if (!cancelled) {
        clearExercisesPendingSync(program.token, localDate)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [canPersistToServer, localDate, online, program.patientId, program.token])

  const beginSession = useCallback(() => {
    markSessionStarted(program.token, localDate)
  }, [localDate, program.token])

  const toggleExercise = useCallback(async (exerciseId: string, completed: boolean) => {
    if (!completed || completedIds.includes(exerciseId)) {
      return
    }

    markSessionStarted(program.token, localDate)
    const previous = completedIds
    const next = mergeIds(completedIds, [exerciseId])

    // Feedback vizual imediat; butonul rămâne blocat după salvarea cu succes.
    setCompletedIds(next)
    setPendingExerciseId(exerciseId)
    saveCompletedExercises(program.token, localDate, next)

    if (!canPersistToServer) {
      setPendingExerciseId(null)
      toast("Marcat ca efectuat (demo).")
      return
    }

    if (!isBrowserOnline()) {
      markExercisesPendingSync(program.token, localDate)
      setPendingExerciseId(null)
      toast(OFFLINE_EXERCISE_TOAST)
      return
    }

    try {
      const response = await fetch("/api/patient/exercise-completion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: program.token,
          exerciseId,
          completed: true,
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

      toast("Exercițiu marcat ca efectuat.")
    } catch (err) {
      console.error("[Marchează ca Efectuat] network/error", err)
      if (isLikelyOfflineError(err)) {
        markExercisesPendingSync(program.token, localDate)
        toast(OFFLINE_EXERCISE_TOAST)
        return
      }
      setCompletedIds(previous)
      saveCompletedExercises(program.token, localDate, previous)
      toast("Nu am putut salva. Verifică conexiunea și încearcă din nou.")
    } finally {
      setPendingExerciseId(null)
    }
  }, [canPersistToServer, completedIds, localDate, program.patientId, program.token])

  function submitCheckin() {
    setError(null)
    setErrorTone("error")
    if (!allExercisesCompleted(exerciseIds, completedIds)) {
      setError(CHECKIN_REQUIRES_EXERCISES_MESSAGE)
      return
    }
    if (sleep === null) {
      setError("Alege calitatea somnului ca să trimiți check-in-ul.")
      return
    }
    if (!isBrowserOnline()) {
      saveCheckinDraft(program.token, localDate, { pain, sleep, energy, notes })
      setErrorTone("offline")
      setError(OFFLINE_CHECKIN_MESSAGE)
      return
    }

    startTransition(async () => {
      const vasScore = Number.parseInt(String(pain), 10)
      if (!Number.isInteger(vasScore) || vasScore < 0 || vasScore > 10) {
        setError("Alege un scor de durere între 0 și 10.")
        return
      }

      const sessionStartedAt = loadSessionStartedAt(program.token, localDate)
      const payload: DailyCheckin = {
        submittedAt: new Date().toISOString(),
        localDate,
        pain: vasScore,
        sleep,
        painKind: null,
        energy,
        notes: notes.trim(),
        completedExerciseIds: completedIds,
        exerciseDurationSeconds: computeExerciseDurationSeconds(sessionStartedAt),
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
      if (sessionStartedAt) {
        formData.set("sessionStartedAt", sessionStartedAt)
      }
      try {
        const result = await submitPatientCheckin(formData)
        if (result.error) {
          setErrorTone(isLikelyOfflineError(result.error) ? "offline" : "error")
          setError(
            isLikelyOfflineError(result.error) ? OFFLINE_CHECKIN_MESSAGE : result.error,
          )
          return
        }

        const stored = result.checkin ?? payload
        saveTodaysCheckin(program.token, stored)
        clearCheckinDraft(program.token, localDate)
        setJustSubmitted(!result.alreadySubmitted)
      } catch (err) {
        if (isLikelyOfflineError(err)) {
          saveCheckinDraft(program.token, localDate, { pain, sleep, energy, notes })
          setErrorTone("offline")
          setError(OFFLINE_CHECKIN_MESSAGE)
          return
        }
        setErrorTone("error")
        setError("Nu am putut trimite check-in-ul. Încearcă din nou.")
      }
    })
  }

  return (
    <PatientThemeProvider>
    <AppShell>
      <PatientOnboardingModal patientKey={program.token} />
      <PatientPushOnboarding patientKey={program.token} firstName={program.firstName} />
      <PatientPushListener portalToken={program.token} />
      <PatientHeader firstName={program.firstName} dateLabel={dateLabel} onOpenGuide={() => setGuideOpen(true)} />
      <ConnectionBanner online={online} justReconnected={justReconnected} />

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 overflow-x-hidden px-4 py-6 pb-16 sm:px-6 lg:gap-10 lg:px-8 lg:py-8">
        {/* Check-in full-width */}
        <section className="w-full min-w-0">
          {!isClient ? (
            <div className="h-56 w-full animate-pulse rounded-2xl border border-slate-200 bg-white dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]" />
          ) : storedCheckin ? (
            <CheckinSuccess checkin={storedCheckin} alreadySubmitted={!justSubmitted} />
          ) : (
            <DailyCheckinForm
              pain={pain}
              sleep={sleep}
              energy={energy}
              notes={notes}
              error={error}
              errorTone={errorTone}
              pending={pending}
              submitEnabled={submitEnabled}
              offline={!online}
              exercisesDone={exercisesDone}
              exercisesTotal={exerciseIds.length}
              onPainChange={setPain}
              onSleepChange={setSleep}
              onEnergyChange={setEnergy}
              onNotesChange={setNotes}
              onSubmit={submitCheckin}
            />
          )}
        </section>

        {/* Terapeut + Reguli — 2 coloane egale */}
        <section className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-2 lg:gap-6">
          <TherapistCard
            therapistName={program.therapistName}
            therapistPhone={program.therapistPhone}
            therapistAdvice={program.therapistAdvice}
          />
          <GoldenRulesCard />
        </section>

        {/* Exerciții pe 3 coloane */}
        <section className="flex min-w-0 flex-col gap-5">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-slate-800 sm:text-xl dark:text-[var(--kf-text)]">
              Exercițiile de azi
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">
              Urmărește video-ul, apoi bifează exercițiul. Check-in-ul se deblochează când sunt toate efectuate.
            </p>
          </div>

          {showCelebration ? <ExercisesCompleteCelebration animate={celebrateAnimate} /> : null}

          {program.exercises.length === 0 ? (
            <p className="rounded-2xl border border-slate-200 bg-white px-5 py-6 text-sm text-slate-600 shadow-sm dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)] dark:text-[var(--kf-text-muted)]">
              Terapeutul nu a alocat încă exerciții pentru azi. Poți trimite check-in-ul.
            </p>
          ) : (
            <div className="grid grid-cols-1 items-stretch gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {program.exercises.map((exercise) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  completed={completedIds.includes(exercise.id)}
                  pending={pendingExerciseId === exercise.id}
                  onToggle={toggleExercise}
                  onSessionStart={beginSession}
                />
              ))}
            </div>
          )}
        </section>

        {/* Ghid educațional */}
        <section className="min-w-0">
          <RecoveryGuidePanel onReadMore={() => setTipsOpen(true)} />
        </section>
      </main>

      {guideOpen ? (
        <RecoveryDrawer title="Ghid recuperare" onClose={() => setGuideOpen(false)}>
          <TherapistSupportColumn
            therapistName={program.therapistName}
            therapistPhone={program.therapistPhone}
            therapistAdvice={program.therapistAdvice}
          />
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
    </PatientThemeProvider>
  )
}
