import Link from "next/link"

import { SupportModal } from "@/components/SupportModal"

function FooterSeparator() {
  return (
    <span className="select-none text-slate-300" aria-hidden="true">
      ·
    </span>
  )
}

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50 px-4 py-3.5">
      <nav
        aria-label="Informații legale"
        className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-center text-xs text-muted-foreground"
      >
        <span>© {year} KinetoFlow</span>
        <FooterSeparator />
        <Link href="/termeni" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">
          Termeni și Condiții
        </Link>
        <FooterSeparator />
        <Link
          href="/confidentialitate"
          className="underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          Politica de Confidențialitate
        </Link>
        <FooterSeparator />
        <SupportModal />
      </nav>
    </footer>
  )
}
