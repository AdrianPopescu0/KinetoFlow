import Link from "next/link"

import { Logo } from "@/components/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" prefetch className="min-w-0 shrink-0" aria-label="KinetoFlow — pagina principală">
          <Logo size="sm" className="sm:hidden" />
          <Logo size="md" className="hidden sm:inline-flex" />
        </Link>
        <Link
          href="/login"
          prefetch
          className={cn(buttonVariants(), "h-10 shrink-0 rounded-xl px-4")}
        >
          Autentificare
        </Link>
      </div>
    </header>
  )
}
