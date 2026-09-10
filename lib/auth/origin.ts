import { headers } from "next/headers"

import { resolveAppOrigin } from "@/lib/auth/site-origin"

export {
  CANONICAL_PRODUCTION_ORIGIN,
  LOCAL_DEV_ORIGIN,
  isVercelAppOrigin,
  normalizeOrigin,
  oauthCallbackUrl,
  requestAppOrigin,
  resolveAppOrigin,
  stripTrailingSlash,
} from "@/lib/auth/site-origin"

export async function appOrigin(): Promise<string> {
  try {
    const headerStore = await headers()
    return resolveAppOrigin({
      forwardedHost: headerStore.get("x-forwarded-host"),
      forwardedProto: headerStore.get("x-forwarded-proto"),
      host: headerStore.get("host"),
      envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    })
  } catch {
    return resolveAppOrigin({
      envSiteUrl: process.env.NEXT_PUBLIC_SITE_URL,
    })
  }
}
