"use client"

import { useEffect } from "react"

import {
  clearStoredTherapistInviteToken,
  persistTherapistInviteToken,
  readStoredTherapistInviteToken,
  therapistInviteFinalizeHref,
} from "@/lib/clinics/invite-session"

export function PersistTherapistInviteToken({ token }: { token: string }) {
  useEffect(() => {
    persistTherapistInviteToken(token)
  }, [token])
  return null
}

/** Dacă Google a picat pe onboarding fără cookie, tokenul din localStorage duce la asocierea clinicii. */
export function ResumePendingTherapistInvite() {
  useEffect(() => {
    const token = readStoredTherapistInviteToken()
    if (!token) {
      return
    }
    persistTherapistInviteToken(token)
    window.location.replace(therapistInviteFinalizeHref(token))
  }, [])
  return null
}

export function ClearSettledTherapistInvite() {
  useEffect(() => {
    clearStoredTherapistInviteToken()
  }, [])
  return null
}
