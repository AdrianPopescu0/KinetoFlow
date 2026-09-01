import Link from "next/link"

import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export default function PatientNotFound() {
  return (
    <AppShell>
      <main className="mx-auto flex min-h-full max-w-md flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className={surfaceCardClassName("px-6 py-10")}>
          <div className="flex justify-center">
            <KinetoFlowMark className="size-10 text-[#042f2e]" />
          </div>
          <p className="mt-4 text-sm font-semibold tracking-[0.16em] text-[#042f2e] uppercase">
            KinetoFlow
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-800">
            Linkul programului nu este valid
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Cere terapeutului un nou link personal. Tokenul trebuie să aibă cel puțin 4 caractere.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-[48px] items-center text-sm font-medium text-[#042f2e] underline-offset-4 hover:underline"
          >
            Înapoi acasă
          </Link>
        </div>
      </main>
    </AppShell>
  )
}
