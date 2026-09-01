import Link from "next/link"

import { AppAtmosphere, glassCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export default function PatientNotFound() {
  return (
    <AppAtmosphere>
      <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className={glassCardClassName("px-6 py-10")}>
          <div className="flex justify-center">
            <KinetoFlowMark className="size-10 text-teal-300" />
          </div>
          <p className="mt-4 text-sm font-semibold tracking-[0.16em] text-teal-100/80 uppercase">
            KinetoFlow
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-white">
            Linkul programului nu este valid
          </h1>
          <p className="mt-2 text-sm text-emerald-100/70">
            Cere terapeutului un nou link personal. Tokenul trebuie să aibă cel puțin 4 caractere.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[48px] items-center text-sm font-medium text-teal-300 underline-offset-4 hover:underline"
          >
            Înapoi acasă
          </Link>
        </div>
      </main>
    </AppAtmosphere>
  )
}
