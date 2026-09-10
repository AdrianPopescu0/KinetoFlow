/** Domeniul canonic de producție — nu URL-ul de deployment Vercel. */
export const CANONICAL_PRODUCTION_ORIGIN = "https://kinetoflow.ro"
export const LOCAL_DEV_ORIGIN = "http://127.0.0.1:43123"

export function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "")
}

export function isVercelAppOrigin(value: string): boolean {
  try {
    return new URL(value).hostname.toLowerCase().endsWith(".vercel.app")
  } catch {
    return value.toLowerCase().includes("vercel.app")
  }
}

export function normalizeOrigin(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`)
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null
    }
    return stripTrailingSlash(`${url.protocol}//${url.host}`)
  } catch {
    return null
  }
}

function originFromHost(host: string | null | undefined, proto: string | null | undefined): string | null {
  if (!host) {
    return null
  }
  const hostname = host.split(",")[0]?.trim()
  if (!hostname) {
    return null
  }
  const scheme = (proto ?? "https").split(",")[0]?.trim() || "https"
  return normalizeOrigin(`${scheme}://${hostname}`)
}

export type ResolveAppOriginInput = {
  requestOrigin?: string | null
  forwardedHost?: string | null
  forwardedProto?: string | null
  host?: string | null
  envSiteUrl?: string | null
  production?: boolean
}

function isLocalHostname(hostname: string): boolean {
  const host = hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0"
}

function isUsablePublicOrigin(origin: string, production: boolean): boolean {
  if (isVercelAppOrigin(origin)) {
    return false
  }
  if (production && isLocalHostname(new URL(origin).hostname)) {
    return false
  }
  return true
}

/**
 * Originea pentru redirecturi de auth: hostul curent al request-ului / ferestrei,
 * niciodată un `*.vercel.app`. Dacă tot ce avem e Vercel, folosim kinetoflow.ro.
 */
export function resolveAppOrigin(input: ResolveAppOriginInput = {}): string {
  const production = input.production ?? process.env.NODE_ENV === "production"
  const candidates = [
    originFromHost(input.forwardedHost, input.forwardedProto),
    input.requestOrigin ? normalizeOrigin(input.requestOrigin) : null,
    originFromHost(input.host, input.forwardedProto ?? (production ? "https" : "http")),
    input.envSiteUrl ? normalizeOrigin(input.envSiteUrl) : null,
  ]

  const usable = candidates.find(
    (origin): origin is string => origin !== null && isUsablePublicOrigin(origin, production),
  )
  if (usable) {
    return usable
  }

  return production ? CANONICAL_PRODUCTION_ORIGIN : LOCAL_DEV_ORIGIN
}

export function oauthCallbackUrl(origin: string, next: string): string {
  const safeNext = next.startsWith("/") ? next : "/onboarding"
  return `${stripTrailingSlash(origin)}/auth/callback?next=${encodeURIComponent(safeNext)}`
}

export function requestAppOrigin(request: {
  nextUrl: { origin: string }
  headers: { get: (name: string) => string | null }
}): string {
  return resolveAppOrigin({
    requestOrigin: request.nextUrl.origin,
    forwardedHost: request.headers.get("x-forwarded-host"),
    forwardedProto: request.headers.get("x-forwarded-proto"),
    host: request.headers.get("host"),
    envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  })
}
