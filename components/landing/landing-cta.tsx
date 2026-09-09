import Link from "next/link"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingCta() {
  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className={surfaceCardClassName("mx-auto max-w-3xl px-6 py-10 text-center sm:px-10 sm:py-12")}>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          Ai deja cont? Intră în platformă.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
          Autentificarea e rezervată terapeuților și administratorilor invitați în clinică. Nu
          partaja parola și închide sesiunea pe dispozitive partajate.
        </p>
        <Link
          href="/login"
          prefetch
          className={cn(buttonVariants(), "mt-7 inline-flex h-12 min-h-[48px] rounded-xl px-6 text-base")}
        >
          Autentificare
        </Link>
      </div>
    </section>
  )
}
