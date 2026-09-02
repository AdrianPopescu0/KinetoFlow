import type { Metadata } from "next"
import Link from "next/link"

import { PatientAccessForm } from "@/app/acces/access-form"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export const metadata: Metadata = {
  title: "Acces pacient | KinetoFlow",
  description: "Intră în programul de recuperare cu telefonul și codul de 8 cifre primit de la terapeut.",
}

export default function PatientAccessPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2">
          <KinetoFlowMark className="size-8 text-[#042f2e]" />
          <span className="text-sm font-semibold tracking-[0.16em] text-[#042f2e] uppercase">KinetoFlow</span>
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Acces pacient</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Introdu numărul de telefon și codul de 8 cifre primit pe WhatsApp. Nu ai nevoie de parolă.
          </p>
          <div className="mt-6">
            <PatientAccessForm />
          </div>
        </div>
      </main>
    </div>
  )
}
