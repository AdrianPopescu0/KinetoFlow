import type { Metadata } from "next"

import { RecoverPatientSession } from "@/components/patient/recover-patient-session"

export const metadata: Metadata = {
  title: "Program pacient | KinetoFlow",
  description: "Recuperare automată a sesiunii dacă linkul din WhatsApp sau Facebook este incomplet.",
}

export default function PatientResumePage() {
  return <RecoverPatientSession />
}
