import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PatientPortal } from "@/components/patient/patient-portal"
import { PersistPatientToken } from "@/components/patient/persist-patient-token"
import { resolvePatientProgram, urlTokenOrRedirectFromCookies } from "@/lib/patients/resolve-program"

type PatientPageProps = {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PatientPageProps): Promise<Metadata> {
  const { token: rawToken } = await params
  const token = await urlTokenOrRedirectFromCookies(rawToken)
  const program = await resolvePatientProgram(token)

  if (!program) {
    return { title: "Program invalid | KinetoFlow" }
  }

  return {
    title: `Programul lui ${program.firstName} | KinetoFlow`,
    description: "Exercițiile de azi și check-in-ul zilnic pentru recuperare.",
  }
}

export default async function PatientPublicPage({ params }: PatientPageProps) {
  const { token: rawToken } = await params
  const token = await urlTokenOrRedirectFromCookies(rawToken)
  const program = await resolvePatientProgram(token)

  if (!program) {
    notFound()
  }

  return (
    <>
      <PersistPatientToken token={program.token} />
      <PatientPortal program={program} />
    </>
  )
}
