import Link from "next/link"

import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className={surfaceCardClassName("max-w-xl px-6 py-10 text-center sm:px-10")}>
          <div className="flex justify-center">
            <KinetoFlowMark className="size-10 text-[#042f2e]" />
          </div>
          <p className="mt-4 text-sm font-semibold tracking-[0.18em] text-[#042f2e] uppercase">
            KinetoFlow
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance text-slate-800 sm:text-4xl">
            Platforma clinică pentru kinetoterapie
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Gestionează programele de recuperare, urmărește progresul pacienților și păstrează
            accesul clinic securizat.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              className={cn(buttonVariants(), "h-12 min-h-[48px] rounded-xl px-5")}
            >
              Autentificare
            </Link>
            <Link
              href="/p/demo"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 min-h-[48px] rounded-xl px-5",
              )}
            >
              Program pacient (demo)
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
