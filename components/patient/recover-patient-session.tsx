"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { Logo } from "@/components/Logo"
import { patientPublicPath } from "@/lib/patients/session"
import { readStoredPatientToken } from "@/lib/patients/token-storage"

export function RecoverPatientSession() {
  const router = useRouter()
  const [status, setStatus] = useState<"searching" | "missing">("searching")

  useEffect(() => {
    const token = readStoredPatientToken()
    if (token) {
      router.replace(patientPublicPath(token))
      return
    }
    setStatus("missing")
  }, [router])

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-12">
        <Link href="/" className="mb-8 inline-flex items-center">
          <Logo size="md" />
        </Link>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {status === "searching" ? (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Reîncărcăm programul
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Linkul din WhatsApp sau Facebook a pierdut tokenul. Căutăm sesiunea salvată pe
                acest dispozitiv…
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Link incomplet
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Deschide din nou linkul primit de la terapeut sau intră cu telefonul și codul de 8
                cifre.
              </p>
              <Link
                href="/acces"
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-teal-700 px-4 text-sm font-medium text-white hover:bg-teal-800"
              >
                Acces cu telefon și cod
              </Link>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
