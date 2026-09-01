import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export const metadata: Metadata = {
  title: "Autentificare | KinetoFlow",
  description: "Autentifică-te în KinetoFlow pentru a gestiona programele de kinetoterapie.",
}

export default function LoginPage() {
  return (
    <div className="grid min-h-full flex-1 bg-white lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#042f2e] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-white" />
            <p className="text-sm font-medium tracking-[0.18em] text-white uppercase">KinetoFlow</p>
          </div>
          <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight text-balance">
            Continuă tratamentele, fără întreruperi.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-teal-50/85">
            Platforma clinică pentru kinetoterapeuți: programe, progres și comunicare cu
            pacienții, într-un singur spațiu securizat.
          </p>
        </div>

        <ul className="relative space-y-3 text-sm text-teal-50/90">
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-300" />
            Sesiune protejată cu Supabase Auth
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-300" />
            Acces doar pentru personalul clinic autorizat
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-300" />
            Datele de autentificare nu sunt dezvăluite în mesajele de eroare
          </li>
        </ul>
      </aside>

      <main className="flex flex-col justify-center bg-white px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md bg-white">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <KinetoFlowMark className="size-8 text-[#042f2e]" />
            <p className="text-sm font-semibold tracking-[0.16em] text-[#042f2e] uppercase">
              KinetoFlow
            </p>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Autentificare
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Introdu datele contului clinic pentru a accesa dashboard-ul.
            </p>
          </div>

          <LoginForm />

          <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
            Accesul este rezervat terapeuților și administratorilor KinetoFlow. Nu partaja
            parola și închide sesiunea pe dispozitive partajate.
          </p>
        </div>
      </main>
    </div>
  )
}
