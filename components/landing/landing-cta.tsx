import { surfaceCardClassName } from "@/components/brand/app-atmosphere"

export function LandingCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className={surfaceCardClassName("mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-12")}>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Accesul este pe bază de invitație
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          În această etapă, terapeuții și administratorii intră doar cu un cod Early Access.
          Folosiți butonul de mai sus, introduceți cele 12 caractere primite și continuați cu
          înregistrarea clinicii sau autentificarea. Pacienții rămân pe fluxul lor, cu telefonul
          și codul de 8 cifre.
        </p>
      </div>
    </section>
  )
}
