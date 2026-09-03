"use client"

import { useEffect } from "react"

import { persistPatientTokenClient } from "@/lib/patients/token-storage"

/** Saves a validated portal token as soon as the public patient page renders. */
export function PersistPatientToken({ token }: { token: string }) {
  persistPatientTokenClient(token)

  useEffect(() => {
    persistPatientTokenClient(token)
  }, [token])

  return null
}
