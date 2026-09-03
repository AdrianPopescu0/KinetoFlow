"use client"

import {
  PATIENT_RESUME_COOKIE,
  PATIENT_TOKEN_STORAGE_KEY,
  looksLikePatientToken,
} from "@/lib/patients/session"

function resumeCookieWrite(token: string, maxAgeSeconds?: number): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  const maxAge =
    typeof maxAgeSeconds === "number" ? `; Max-Age=${maxAgeSeconds}` : ""
  document.cookie = `${PATIENT_RESUME_COOKIE}=${encodeURIComponent(token)}; Path=/; SameSite=Lax${secure}${maxAge}`
}

export function persistPatientTokenClient(token: string): void {
  if (typeof window === "undefined" || !looksLikePatientToken(token)) {
    return
  }

  try {
    localStorage.setItem(PATIENT_TOKEN_STORAGE_KEY, token)
  } catch {
    // Safari private mode / blocked storage
  }

  try {
    resumeCookieWrite(token)
  } catch {
    // Cookie blocked
  }
}

export function readStoredPatientToken(): string | null {
  try {
    const fromStorage = localStorage.getItem(PATIENT_TOKEN_STORAGE_KEY)
    if (fromStorage && looksLikePatientToken(fromStorage)) {
      return fromStorage
    }
  } catch {
    // ignore
  }

  try {
    const prefix = `${PATIENT_RESUME_COOKIE}=`
    const row = document.cookie.split("; ").find((part) => part.startsWith(prefix))
    if (!row) {
      return null
    }
    const value = decodeURIComponent(row.slice(prefix.length))
    return looksLikePatientToken(value) ? value : null
  } catch {
    return null
  }
}

export function clearStoredPatientToken(): void {
  try {
    localStorage.removeItem(PATIENT_TOKEN_STORAGE_KEY)
  } catch {
    // ignore
  }

  try {
    const secure = window.location.protocol === "https:" ? "; Secure" : ""
    document.cookie = `${PATIENT_RESUME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
  } catch {
    // ignore
  }
}
