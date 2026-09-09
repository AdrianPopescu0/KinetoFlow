import Link from "next/link"

import { Logo } from "@/components/Logo"

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-slate-50/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" prefetch className="min-w-0 shrink-0" aria-label="KinetoFlow — pagina principală">
          <Logo size="sm" className="sm:hidden" />
          <Logo size="md" className="hidden sm:inline-flex" />
        </Link>
      </div>
    </header>
  )
}
