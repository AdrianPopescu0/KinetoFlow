"use client"

import { useState, useSyncExternalStore } from "react"
import { BellRing, Smartphone } from "lucide-react"

import {
  markOnboardingSeen,
  onboardingSeenServerSnapshot,
  patientOnboardingKey,
  patientPushPromptKey,
  readOnboardingSeen,
  subscribeOnboardingFlag,
} from "@/lib/onboarding/seen-flag"
import { requestPatientPushToken, savePatientPushToken } from "@/lib/patients/fcm-client"
import { isPatientUuidToken } from "@/lib/patients/session"
import { toast } from "@/components/ui/toaster"

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") {
    return false
  }
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function PatientPushOnboarding({
  patientKey,
  firstName,
}: {
  patientKey: string
  firstName: string
}) {
  const tourKey = patientOnboardingKey(patientKey)
  const promptKey = patientPushPromptKey(patientKey)
  const tourSeen = useSyncExternalStore(
    subscribeOnboardingFlag,
    () => readOnboardingSeen(tourKey),
    onboardingSeenServerSnapshot,
  )
  const promptSeen = useSyncExternalStore(
    subscribeOnboardingFlag,
    () => readOnboardingSeen(promptKey),
    onboardingSeenServerSnapshot,
  )
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!patientKey || !tourSeen || promptSeen) {
    return null
  }

  async function enablePush() {
    setBusy(true)
    setError(null)
    const result = await requestPatientPushToken()
    if (result.permission === "unsupported") {
      setError(
        isIosDevice()
          ? "Pe iPhone, adaugă KinetoFlow pe ecranul principal (Partajează → Adaugă pe ecranul principal), deschide aplicația de acolo, apoi activează notificările."
          : "Acest browser nu poate primi notificări push. Folosește Chrome sau Safari pe telefon.",
      )
      setBusy(false)
      return
    }
    if (result.permission !== "granted") {
      setError("Ai blocat notificările. Le poți porni din setările browserului, apoi revino aici.")
      setBusy(false)
      return
    }
    if (!result.token) {
      setError(result.error ?? "Nu am putut activa notificările pe acest dispozitiv.")
      setBusy(false)
      return
    }

    if (isPatientUuidToken(patientKey)) {
      const saved = await savePatientPushToken({ portalToken: patientKey, fcmToken: result.token })
      if (!saved.ok) {
        setError(saved.error ?? "Nu am putut salva dispozitivul.")
        setBusy(false)
        return
      }
    }

    markOnboardingSeen(promptKey)
    toast("Notificările sunt active. Te anunțăm când e momentul pentru check-in.")
    setBusy(false)
  }

  function dismiss() {
    markOnboardingSeen(promptKey)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="patient-push-title"
        className="w-full max-w-md rounded-t-3xl border border-slate-200 bg-white px-5 pt-6 pb-8 shadow-xl sm:rounded-3xl sm:px-7"
      >
        <div className="mx-auto h-1.5 w-12 rounded-full bg-slate-200 sm:hidden" aria-hidden="true" />

        <div className="mt-6 flex flex-col items-center text-center">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-teal-50 text-[#042f2e]">
            <BellRing className="size-8" />
          </span>
          <h2 id="patient-push-title" className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            {firstName}, nu rata check-in-ul de azi
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600">
            Îți trimitem o notificare pe telefon când e momentul să notezi cum te simți și să faci
            exercițiile. Fără SMS, fără WhatsApp — un reminder scurt, o dată pe zi, direct în
            programul tău.
          </p>
        </div>

        <ul className="mt-6 space-y-3 text-left text-sm text-slate-700">
          <li className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Smartphone className="mt-0.5 size-5 shrink-0 text-teal-700" />
            <span>Deschizi programul din notificare, fără să cauți linkul din mesaje.</span>
          </li>
          <li className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <BellRing className="mt-0.5 size-5 shrink-0 text-teal-700" />
            <span>Terapeutul vede check-in-ul la timp și îți poate ajusta recuperarea.</span>
          </li>
        </ul>

        {isIosDevice() ? (
          <p className="mt-4 text-sm leading-relaxed text-slate-500">
            Pe iPhone: Partajează → Adaugă pe ecranul principal, apoi deschide KinetoFlow de acolo
            ca să poți primi notificări.
          </p>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-col gap-3">
          <button
            type="button"
            disabled={busy}
            onClick={() => void enablePush()}
            className="inline-flex h-14 min-h-[56px] w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 text-base font-semibold text-white active:bg-emerald-700 disabled:opacity-60"
          >
            {busy ? "Activăm notificările…" : "Activează notificările"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={dismiss}
            className="h-11 text-sm font-medium text-slate-500 underline-offset-4 active:underline"
          >
            Poate mai târziu
          </button>
        </div>
      </div>
    </div>
  )
}
