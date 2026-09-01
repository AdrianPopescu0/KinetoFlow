import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="max-w-xl text-center">
        <p className="text-sm font-semibold tracking-[0.18em] text-primary uppercase">
          KinetoFlow
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Platforma clinică pentru kinetoterapie
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          Gestionează programele de recuperare, urmărește progresul pacienților și păstrează
          accesul clinic securizat.
        </p>
        <div className="mt-8 flex justify-center">
          <Link href="/login" className={cn(buttonVariants(), "h-11 px-5")}>
            Autentificare
          </Link>
        </div>
      </div>
    </main>
  )
}
