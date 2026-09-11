import Link from "next/link"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className={surfaceCardClassName("mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-12")}>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Gata de lucru în clinică
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Terapeuții și administratorii intră cu email și parolă. Pacienții rămân pe fluxul lor, cu
          telefonul și codul de 8 cifre.
        </p>
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/login"
            prefetch
            className={cn(buttonVariants(), "h-11 rounded-xl px-6")}
          >
            Autentificare
          </Link>
          <Link
            href="/login?mode=signup"
            prefetch
            className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-xl px-6")}
          >
            Creează cont de clinică
          </Link>
        </div>
      </div>
    </section>
  )
}
