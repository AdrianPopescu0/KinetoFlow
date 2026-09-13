import Link from "next/link"

import { Logo } from "@/components/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0c1615]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" prefetch className="min-w-0 shrink-0" aria-label="KinetoFlow — pagina principală">
          <Logo size="sm" variant="onDark" className="sm:hidden" />
          <Logo size="md" variant="onDark" className="hidden sm:inline-flex" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label="Navigare principală">
          <Link
            href="#despre"
            className="hidden text-sm font-medium text-teal-100/80 transition-colors hover:text-white sm:inline"
          >
            Despre
          </Link>
          <Link
            href="#beneficii"
            className="hidden text-sm font-medium text-teal-100/80 transition-colors hover:text-white sm:inline"
          >
            Beneficii
          </Link>
          <Link
            href="#intrebari-frecvente"
            className="hidden text-sm font-medium text-teal-100/80 transition-colors hover:text-white sm:inline"
          >
            Întrebări
          </Link>
          <Link
            href="/login"
            prefetch
            className={cn(
              buttonVariants(),
              "h-10 shrink-0 rounded-xl bg-teal-400 px-4 text-[#042f2e] hover:bg-teal-300",
            )}
          >
            Autentificare
          </Link>
        </nav>
      </div>
    </header>
  )
}
