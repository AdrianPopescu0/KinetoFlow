import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"
import { AppAtmosphere } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export const metadata: Metadata = {
  title: "Autentificare | KinetoFlow",
  description: "Autentifică-te în KinetoFlow pentru a gestiona programele de kinetoterapie.",
}

export default function LoginPage() {
  return (
    <AppAtmosphere>
      <div className="grid min-h-full flex-1 lg:grid-cols-[1.05fr_0.95fr]">
        <aside className="relative hidden overflow-hidden px-12 py-12 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <KinetoFlowMark className="size-8 text-teal-300" />
              <p className="text-sm font-medium tracking-[0.18em] text-teal-100/80 uppercase">
                KinetoFlow
              </p>
            </div>
            <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight text-balance text-white">
              Continuă tratamentele, fără întreruperi.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-emerald-100/70">
              Platforma clinică pentru kinetoterapeuți: programe, progres și comunicare cu
              pacienții, într-un singur spațiu securizat.
            </p>
          </div>

          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-400" />
              Sesiune protejată cu Supabase Auth
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-400" />
              Acces doar pentru personalul clinic autorizat
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-400" />
              Datele de autentificare nu sunt dezvăluite în mesajele de eroare
            </li>
          </ul>
        </aside>

        <main className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
          <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_-28px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-8">
            <div className="mb-8 flex items-center gap-2 lg:hidden">
              <KinetoFlowMark className="size-8 text-teal-300" />
              <p className="text-sm font-semibold tracking-[0.16em] text-teal-100/80 uppercase">
                KinetoFlow
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Autentificare
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-emerald-100/70">
                Introdu datele contului clinic pentru a accesa dashboard-ul.
              </p>
            </div>

            <LoginForm />

            <p className="mt-8 text-center text-xs leading-relaxed text-slate-300">
              Accesul este rezervat terapeuților și administratorilor KinetoFlow. Nu partaja
              parola și închide sesiunea pe dispozitive partajate.
            </p>
          </div>
        </main>
      </div>
    </AppAtmosphere>
  )
}
