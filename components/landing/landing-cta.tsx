import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingCta() {
  return (
    <section className="px-4 pb-12 sm:px-6 sm:pb-16">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-teal-700/20 bg-[#042f2e] px-6 py-10 text-center sm:px-10 sm:py-14 dark:border-teal-400/20 dark:bg-[#0f2422]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(45,212,191,0.16),transparent_55%)]"
        />
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Gata de lucru în clinică
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-100/75 sm:text-base">
            Terapeuții și administratorii intră cu email și parolă. Pacienții rămân pe fluxul lor, cu
            telefonul și codul de 8 cifre.
          </p>
          <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              prefetch
              className={cn(
                buttonVariants(),
                "h-11 rounded-xl bg-teal-400 px-6 text-[#042f2e] hover:bg-teal-300",
              )}
            >
              Autentificare
            </Link>
            <Link
              href="/login?mode=signup"
              prefetch
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-11 rounded-xl border-white/20 bg-transparent px-6 text-white hover:bg-white/10",
              )}
            >
              Creează cont de clinică
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
