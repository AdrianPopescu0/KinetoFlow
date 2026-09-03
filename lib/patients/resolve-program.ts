import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { loadPatientProgramFromDatabase } from "@/lib/patients/from-database"
import { getPatientProgram } from "@/lib/patients/program"
import {
  PATIENT_RESUME_COOKIE,
  PATIENT_SESSION_COOKIE,
  looksLikePatientToken,
  patientPublicPath,
} from "@/lib/patients/session"

/** If the path token was stripped or truncated, continue from the session cookie. */
export async function urlTokenOrRedirectFromCookies(urlToken: string): Promise<string> {
  if (looksLikePatientToken(urlToken)) {
    return urlToken
  }

  const jar = await cookies()
  const stored =
    jar.get(PATIENT_SESSION_COOKIE)?.value ?? jar.get(PATIENT_RESUME_COOKIE)?.value
  if (stored && looksLikePatientToken(stored)) {
    redirect(patientPublicPath(stored))
  }

  return urlToken
}

export async function resolvePatientProgram(patientToken: string) {
  const fromDatabase = await loadPatientProgramFromDatabase(patientToken)
  if (fromDatabase) {
    return fromDatabase
  }

  return getPatientProgram(patientToken)
}
