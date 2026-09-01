import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PatientPortal } from "@/components/patient/patient-portal"
import { loadPatientProgramFromDatabase } from "@/lib/patients/from-database"
import { getPatientProgram } from "@/lib/patients/program"

type PatientPageProps = {
  params: Promise<{ patientToken: string }>
}

async function resolveProgram(patientToken: string) {
  const fromDatabase = await loadPatientProgramFromDatabase(patientToken)
  if (fromDatabase) {
    return fromDatabase
  }

  return getPatientProgram(patientToken)
}

export async function generateMetadata({ params }: PatientPageProps): Promise<Metadata> {
  const { patientToken } = await params
  const program = await resolveProgram(patientToken)

  if (!program) {
    return { title: "Program invalid | KinetoFlow" }
  }

  return {
    title: `Programul lui ${program.firstName} | KinetoFlow`,
    description: "Exercițiile de azi și check-in-ul zilnic pentru recuperare.",
  }
}

export default async function PatientPage({ params }: PatientPageProps) {
  const { patientToken } = await params
  const program = await resolveProgram(patientToken)

  if (!program) {
    notFound()
  }

  return <PatientPortal program={program} />
}
