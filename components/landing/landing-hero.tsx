import Link from "next/link"

import { EarlyAccessButton } from "@/components/landing/early-access-dialog"

export function LandingHero({ unlockOpen = false }: { unlockOpen?: boolean }) {
  return (
    <section className="relative overflow-hidden px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[28rem]">
        <div className="absolute top-[-7rem] left-1/2 h-72 w-[min(90vw,42rem)] -translate-x-1/2 rounded-full bg-teal-100/80 blur-3xl" />
      </div>
      <div className="relative mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p className="text-xs font-semibold tracking-[0.16em] text-[#0f766e] uppercase">
          Platformă clinică pentru kinetoterapie
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-balance text-slate-900 sm:text-5xl sm:leading-[1.12]">
          Optimizează activitatea. Gestionează recuperarea dintr-un singur loc.
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-medium tracking-tight text-pretty text-[#0f766e] sm:text-xl sm:leading-snug">
          KinetoFlow – Fluxul mișcării și al recuperării.
        </p>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-pretty text-slate-600 sm:text-lg">
          KinetoFlow aduce pacienții, programele de exerciții și echipa clinicii în același flux de
          lucru. Platforma este în Early Access: intrați cu un cod de 12 caractere primit de la
          noi, apoi cu email și parolă. Codul de 6 cifre pe email se cere doar la crearea contului.
        </p>
        <div className="mt-8 flex w-full max-w-sm flex-col items-stretch gap-3 sm:max-w-none sm:flex-row sm:justify-center">
          <EarlyAccessButton initialOpen={unlockOpen} />
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Ești pacient?{" "}
          <Link href="/acces" prefetch className="font-medium text-[#0f766e] underline-offset-4 hover:underline">
            Accesează programul cu telefonul și codul
          </Link>
        </p>
      </div>
    </section>
  )
}
