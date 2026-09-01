import type { Metadata } from "next"

import { RecoveryForm } from "@/app/recuperare-parola/recovery-form"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export const metadata: Metadata = {
  title: "Recuperare parolă | KinetoFlow",
  description: "Resetează parola contului KinetoFlow.",
}

export default function RecuperareParolaPage() {
  return (
    <AppShell>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className={surfaceCardClassName("w-full max-w-md p-6 sm:p-8")}>
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-[#042f2e]" />
            <p className="text-sm font-semibold tracking-[0.16em] text-[#042f2e] uppercase">
              KinetoFlow
            </p>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
            Recuperare parolă
          </h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
            Introdu adresa de email a contului. Dacă este înregistrată, vei primi instrucțiuni de
            resetare. Nu confirmăm dacă adresa există în sistem.
          </p>
          <RecoveryForm />
        </div>
      </main>
    </AppShell>
  )
}
