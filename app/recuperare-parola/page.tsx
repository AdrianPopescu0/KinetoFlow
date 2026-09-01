import type { Metadata } from "next"

import { RecoveryForm } from "@/app/recuperare-parola/recovery-form"
import { AppAtmosphere, glassCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export const metadata: Metadata = {
  title: "Recuperare parolă | KinetoFlow",
  description: "Resetează parola contului KinetoFlow.",
}

export default function RecuperareParolaPage() {
  return (
    <AppAtmosphere>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className={glassCardClassName("w-full max-w-md p-6 sm:p-8")}>
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-teal-300" />
            <p className="text-sm font-semibold tracking-[0.16em] text-teal-100/80 uppercase">
              KinetoFlow
            </p>
          </div>
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            Recuperare parolă
          </h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-emerald-100/70">
            Introdu adresa de email a contului. Dacă este înregistrată, vei primi instrucțiuni de
            resetare. Nu confirmăm dacă adresa există în sistem.
          </p>
          <RecoveryForm />
        </div>
      </main>
    </AppAtmosphere>
  )
}
