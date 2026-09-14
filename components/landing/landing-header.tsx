"use client"

import Link from "next/link"

import { LandingSettingsButton } from "@/components/landing/landing-settings"
import { useLandingLocale } from "@/components/landing/landing-locale"
import { Logo } from "@/components/Logo"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV = {
  ro: {
    about: "Despre",
    benefits: "Beneficii",
    faq: "Întrebări",
    login: "Autentificare",
    home: "KinetoFlow — pagina principală",
  },
  en: {
    about: "About",
    benefits: "Benefits",
    faq: "FAQ",
    login: "Sign in",
    home: "KinetoFlow — home",
  },
} as const

export function LandingHeader() {
  const { locale } = useLandingLocale()
  const nav = NAV[locale]

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 text-slate-800 backdrop-blur-md dark:border-white/10 dark:bg-[#0c1615]/80 dark:text-white">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:h-[4.25rem] sm:px-6">
        <Link href="/" prefetch className="min-w-0 shrink-0" aria-label={nav.home}>
          <Logo size="sm" className="text-slate-900 sm:hidden dark:text-white" />
          <Logo size="md" className="hidden text-slate-900 sm:inline-flex dark:text-white" />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-4" aria-label={locale === "en" ? "Primary" : "Navigare principală"}>
          <Link
            href="#despre"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline dark:text-teal-100/80 dark:hover:text-white"
          >
            {nav.about}
          </Link>
          <Link
            href="#beneficii"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline dark:text-teal-100/80 dark:hover:text-white"
          >
            {nav.benefits}
          </Link>
          <Link
            href="#intrebari-frecvente"
            className="hidden text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 sm:inline dark:text-teal-100/80 dark:hover:text-white"
          >
            {nav.faq}
          </Link>
          <LandingSettingsButton />
          <Link
            href="/login"
            prefetch
            className={cn(
              buttonVariants(),
              "h-10 shrink-0 rounded-xl bg-teal-400 px-4 text-[#042f2e] hover:bg-teal-300",
            )}
          >
            {nav.login}
          </Link>
        </nav>
      </div>
    </header>
  )
}
