import type { ReactNode } from "react"
import Link from "next/link"

import { Logo } from "@/components/Logo"

export function AuthSplitLayout({
  title,
  description,
  children,
  footer,
}: {
  title: string
  description: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="grid min-h-0 flex-1 bg-white lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[#042f2e] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -top-24 -left-16 size-72 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="pointer-events-none absolute right-0 bottom-0 size-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative">
          <Link href="/" className="inline-flex items-center">
            <Logo size="md" variant="onDark" />
          </Link>
          <h1 className="mt-8 max-w-md text-4xl font-semibold tracking-tight text-balance">
            Continuă tratamentele, fără întreruperi.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-teal-50/85">
            Platforma clinică pentru kinetoterapeuți: programe, progres și comunicare cu
            pacienții, într-un singur spațiu securizat.
          </p>
        </div>

        <ul className="relative space-y-3 text-sm text-teal-50/90">
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-300" />
            Autentificare cu email și parolă (Supabase Auth)
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-300" />
            Configurare clinică la prima autentificare
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-teal-300" />
            Acces rezervat personalului clinic
          </li>
        </ul>
      </aside>

      <main className="flex flex-col justify-center bg-white px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md bg-white">
          <div className="mb-8 lg:hidden">
            <Logo size="md" />
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
          </div>

          {children}

          {footer}
        </div>
      </main>
    </div>
  )
}
