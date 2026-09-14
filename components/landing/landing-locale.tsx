"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

import {
  LOCALE_STORAGE_KEY,
  localeHtmlLang,
  parseAppLocale,
  type AppLocale,
} from "@/lib/i18n/locale"

type LandingLocaleContextValue = {
  locale: AppLocale
  setLocale: (next: AppLocale) => void
}

const LandingLocaleContext = createContext<LandingLocaleContextValue | null>(null)

export function LandingLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("ro")

  useEffect(() => {
    const stored = parseAppLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY))
    setLocaleState(stored)
    document.documentElement.lang = localeHtmlLang(stored)
  }, [])

  const value = useMemo<LandingLocaleContextValue>(
    () => ({
      locale,
      setLocale(next) {
        setLocaleState(next)
        try {
          window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
        } catch {
          // ignore quota / private mode
        }
        document.documentElement.lang = localeHtmlLang(next)
      },
    }),
    [locale],
  )

  return <LandingLocaleContext.Provider value={value}>{children}</LandingLocaleContext.Provider>
}

export function useLandingLocale() {
  const context = useContext(LandingLocaleContext)
  if (!context) {
    throw new Error("useLandingLocale trebuie folosit în LandingLocaleProvider.")
  }
  return context
}
