export const APP_LOCALES = ["ro", "en"] as const

export type AppLocale = (typeof APP_LOCALES)[number]

export const LOCALE_STORAGE_KEY = "kf_locale"

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "ro" || value === "en"
}

export function parseAppLocale(...values: unknown[]): AppLocale {
  for (const value of values) {
    if (isAppLocale(value)) {
      return value
    }
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase()
      if (trimmed === "en-us" || trimmed === "en-gb") {
        return "en"
      }
      if (trimmed === "ro-ro") {
        return "ro"
      }
      if (isAppLocale(trimmed)) {
        return trimmed
      }
    }
  }
  return "ro"
}

export function localeHtmlLang(locale: AppLocale): "ro" | "en" {
  return locale
}
