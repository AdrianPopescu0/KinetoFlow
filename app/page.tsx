import Link from "next/link"

import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Logo } from "@/components/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <AppShell>
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
        <div className={surfaceCardClassName("max-w-xl px-6 py-10 text-center sm:px-10")}>
          <div className="flex justify-center">
            <Logo size="lg" />
          </div>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance text-slate-800 sm:text-4xl">
            Platforma clinică pentru kinetoterapie
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
            Gestionează programele de recuperare, urmărește progresul pacienților și păstrează
            accesul clinic securizat.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/login"
              prefetch
              className={cn(buttonVariants(), "h-12 min-h-[48px] rounded-xl px-5")}
            >
              Portal Clinică & Terapeut
            </Link>
            <Link
              href="/acces"
              prefetch
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 min-h-[48px] rounded-xl px-5",
              )}
            >
              Acces Pacient
            </Link>
          </div>
        </div>
      </main>
    </AppShell>
  )
}
