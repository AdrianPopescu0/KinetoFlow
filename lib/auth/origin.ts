import { headers } from "next/headers"

export async function appOrigin(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  try {
    const headerStore = await headers()
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host")
    const proto = headerStore.get("x-forwarded-proto") ?? "http"
    if (host) {
      return `${proto}://${host}`.replace(/\/$/, "")
    }
  } catch {
    // headers() is unavailable in some server contexts
  }

  if (fromEnv) {
    return fromEnv
  }

  return "http://127.0.0.1:43123"
}

export function oauthCallbackUrl(origin: string, next: string): string {
  const safeNext = next.startsWith("/") ? next : "/onboarding"
  return `${origin}/auth/callback?next=${encodeURIComponent(safeNext)}`
}
