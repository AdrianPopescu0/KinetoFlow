"use client"

import { useLayoutEffect, useState, type ReactNode } from "react"

import { claimPendingTherapistInvite } from "@/app/onboarding/actions"
import { clinicReadyFromUser, invitedTherapistFromUser } from "@/lib/clinics/clinic-ready"
import {
  clearStoredTherapistInviteToken,
  persistTherapistInviteToken,
  readStoredTherapistInviteToken,
  therapistInviteFinalizeHref,
} from "@/lib/clinics/invite-session"
import { therapistInvitePagePath } from "@/lib/clinics/invite-attach"
import { createClient } from "@/utils/supabase/client"

export function PersistTherapistInviteToken({ token }: { token: string }) {
  if (typeof window !== "undefined") {
    persistTherapistInviteToken(token)
  }
  return null
}

function PendingInviteMessage({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm leading-relaxed text-slate-600" role="status">
      {children}
    </p>
  )
}

/** Dacă Google a picat pe onboarding fără cookie, tokenul din localStorage duce la asocierea clinicii. */
export function ResumePendingTherapistInvite() {
  useLayoutEffect(() => {
    const token = readStoredTherapistInviteToken()
    if (!token) {
      return
    }
    persistTherapistInviteToken(token)
    window.location.replace(therapistInviteFinalizeHref(token))
  }, [])
  return null
}

export function InvitedTherapistOnboardingGate({ children }: { children: ReactNode }) {
  const [allowed, setAllowed] = useState(false)

  useLayoutEffect(() => {
    const token = readStoredTherapistInviteToken()
    if (token) {
      persistTherapistInviteToken(token)
      window.location.replace(therapistInviteFinalizeHref(token))
      return
    }
    void claimPendingTherapistInvite().then((result) => {
      if (result.ok) {
        window.location.replace("/dashboard")
        return
      }
      const supabase = createClient()
      void supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (user && (clinicReadyFromUser(user) || invitedTherapistFromUser(user))) {
            window.location.replace("/dashboard")
            return
          }
          setAllowed(true)
        })
        .catch(() => {
          setAllowed(true)
        })
    })
  }, [])

  if (!allowed) {
    return (
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 shadow-sm">
        Avem o invitație în așteptare. Te ducem în clinica existentă, nu la crearea unui cabinet nou.
      </div>
    )
  }

  return children
}

export function ResumeTherapistInviteAfterAuth() {
  useLayoutEffect(() => {
    const token = readStoredTherapistInviteToken()
    if (!token) {
      void claimPendingTherapistInvite().then((result) => {
        if (result.ok) {
          window.location.replace("/dashboard")
          return
        }
        const supabase = createClient()
        void supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) {
            window.location.replace("/login")
            return
          }
          if (clinicReadyFromUser(user) || invitedTherapistFromUser(user)) {
            window.location.replace("/dashboard")
            return
          }
          window.location.replace("/onboarding")
        })
      })
      return
    }

    persistTherapistInviteToken(token)
    void claimPendingTherapistInvite(token).then((result) => {
      if (result.ok) {
        window.location.replace("/dashboard")
        return
      }
      window.location.replace(therapistInvitePagePath(token, result.reason))
    })
  }, [])

  return <PendingInviteMessage>Se asociază contul cu clinica din invitație…</PendingInviteMessage>
}

export function ClearSettledTherapistInvite() {
  useLayoutEffect(() => {
    clearStoredTherapistInviteToken()
  }, [])
  return null
}
