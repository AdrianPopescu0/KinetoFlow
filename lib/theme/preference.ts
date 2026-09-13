export const THEME_STORAGE_KEY = "kf_theme"
export const THEME_COOKIE_NAME = "kf_theme"
export const THEME_PREFERENCES = ["light", "dark", "system"] as const

export type ThemePreference = (typeof THEME_PREFERENCES)[number]
export type ResolvedTheme = "light" | "dark"

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system"
}

export function parseThemePreference(...values: unknown[]): ThemePreference {
  for (const value of values) {
    if (isThemePreference(value)) {
      return value
    }
    if (typeof value === "string") {
      const trimmed = value.trim().toLowerCase()
      if (isThemePreference(trimmed)) {
        return trimmed
      }
    }
  }
  return "system"
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): ResolvedTheme {
  if (preference === "light") {
    return "light"
  }
  if (preference === "dark") {
    return "dark"
  }
  return systemDark ? "dark" : "light"
}

export function isThemedAppPath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/patient" ||
    pathname.startsWith("/patient/") ||
    pathname === "/acces" ||
    pathname.startsWith("/acces/") ||
    pathname === "/p" ||
    pathname.startsWith("/p/")
  )
}

export function themeCookieWrite(preference: ThemePreference): string {
  return `${THEME_COOKIE_NAME}=${preference}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`
}

export function writeThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // ignore quota / private mode
  }
  document.cookie = themeCookieWrite(preference)
}

export function applyResolvedTheme(resolved: ResolvedTheme) {
  if (typeof document === "undefined") {
    return
  }
  const root = document.documentElement
  root.classList.toggle("dark", resolved === "dark")
  root.dataset.theme = resolved
  root.style.colorScheme = resolved
}

export const DASHBOARD_THEME_BOOT_SCRIPT = `(function(){try{var p=location.pathname;if(!(p==="/dashboard"||p.indexOf("/dashboard/")===0||p==="/patient"||p.indexOf("/patient/")===0||p==="/acces"||p.indexOf("/acces/")===0||p==="/p"||p.indexOf("/p/")===0))return;var k=${JSON.stringify(THEME_STORAGE_KEY)};var raw=(localStorage.getItem(k)||"").trim().toLowerCase();if(raw!=="light"&&raw!=="dark"&&raw!=="system"){var m=document.cookie.match(/(?:^|; )${THEME_COOKIE_NAME}=([^;]*)/);raw=m?decodeURIComponent(m[1]).trim().toLowerCase():"system"}var pref=raw==="light"||raw==="dark"||raw==="system"?raw:"system";var dark=pref==="dark"||(pref==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",dark);r.dataset.theme=dark?"dark":"light";r.style.colorScheme=dark?"dark":"light"}catch(e){}})();`
