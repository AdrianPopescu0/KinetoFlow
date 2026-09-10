"use client"

import { useLayoutEffect, useState } from "react"

import { claimPendingTherapistInvite } from "@/app/onboarding/actions"
import { OnboardingForm } from "@/app/onboarding/onboarding-form"
import { therapistInvitePagePath } from "@/lib/clinics/invite-attach"
import {
  clearStoredTherapistInviteToken,
  persistTherapistInviteToken,
  readStoredTherapistInviteToken,
} from "@/lib/clinics/invite-session"

type OnboardingPhase = "checking" | "joining" | "form"

export function OnboardingClient({
  email,
  clinicLoadError,
}: {
  email?: string | null
  clinicLoadError?: string | null
}) {
  const [phase, setPhase] = useState<OnboardingPhase>("checking")

  useLayoutEffect(() => {
    const token = readStoredTherapistInviteToken()
    if (!token) {
      setPhase("form")
      return
    }

    persistTherapistInviteToken(token)
    setPhase("joining")
    void claimPendingTherapistInvite(token).then((result) => {
      if (result.ok) {
        window.location.replace("/dashboard")
        return
      }
      clearStoredTherapistInviteToken()
      window.location.replace(therapistInvitePagePath(token, result.reason))
    })
  }, [])

  if (phase !== "form") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" role="status">
        <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Invitație în clinică</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          {phase === "joining" ? "Intrăm în clinica existentă" : "Verificăm invitația"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {phase === "joining"
            ? "Am găsit invitația salvată. Asociem contul cu clinica și te ducem în dashboard, fără să creezi un cabinet nou."
            : "Dacă ai fost invitat într-o clinică, te ducem acolo automat. Nu cerem crearea unui cabinet nou."}
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Prima configurare</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        Configurează cabinetul tău
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        Aceste date separă activitatea clinicii tale de a altor cabinete din platformă.
        {email ? (
          <>
            {" "}
            Cont: <span className="font-medium text-slate-800">{email}</span>
          </>
        ) : null}
      </p>

      {clinicLoadError ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nu am putut citi profilul clinicii: {clinicLoadError}
        </p>
      ) : null}

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <OnboardingForm />
      </div>
    </>
  )
}
