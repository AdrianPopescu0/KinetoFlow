import type { ReactNode } from "react"
import Link from "next/link"

import { AppShell } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-[#042f2e]" />
            <span className="text-sm font-semibold tracking-[0.16em] text-[#042f2e] uppercase">KinetoFlow</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-x-4 gap-y-1 text-sm">
            <Link href="/termeni" className="font-medium text-slate-600 hover:text-[#042f2e]">
              Termeni
            </Link>
            <Link href="/confidentialitate" className="font-medium text-slate-600 hover:text-[#042f2e]">
              Confidențialitate
            </Link>
            <Link href="/login" className="font-medium text-[#042f2e] hover:underline">
              Cont clinică
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </AppShell>
  )
}
