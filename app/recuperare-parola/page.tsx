import type { Metadata } from "next"

import { RecoveryForm } from "@/app/recuperare-parola/recovery-form"

export const metadata: Metadata = {
  title: "Recuperare parolă | KinetoFlow",
  description: "Resetează parola contului KinetoFlow.",
}

export default function RecuperareParolaPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
          KinetoFlow
        </p>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Recuperare parolă</h1>
        <p className="mt-2 mb-6 text-sm leading-relaxed text-muted-foreground">
          Introdu adresa de email a contului. Dacă este înregistrată, vei primi instrucțiuni de
          resetare. Nu confirmăm dacă adresa există în sistem.
        </p>
        <RecoveryForm />
      </div>
    </main>
  )
}
