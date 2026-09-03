import { SET_PASSWORD_PATH } from "@/lib/auth/paths"

const SITE_URL_FALLBACK = "https://kinetoflow96-git-main-kinetic-fl-ow.vercel.app"

export const ACTIVARE_PATH = "/auth/activare"

export function inviteSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (fromEnv) {
    return fromEnv
  }
  return SITE_URL_FALLBACK
}

export function recoveryRedirectTo(siteUrl = inviteSiteUrl()): string {
  return `${siteUrl}/auth/callback?next=${SET_PASSWORD_PATH}`
}

type GenerateLinkPayload = {
  properties?: {
    action_link?: string
    hashed_token?: string
    verification_type?: string
  }
  action_link?: string
}

function readActionLink(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null
  }
  const record = payload as GenerateLinkPayload
  if (typeof record.properties?.action_link === "string" && record.properties.action_link.length > 0) {
    return record.properties.action_link
  }
  if (typeof record.action_link === "string" && record.action_link.length > 0) {
    return record.action_link
  }
  return null
}

function readHashedToken(payload: unknown, actionLink: string | null): string | null {
  if (payload && typeof payload === "object") {
    const hashed = (payload as GenerateLinkPayload).properties?.hashed_token
    if (typeof hashed === "string" && hashed.length > 0) {
      return hashed
    }
  }
  if (!actionLink) {
    return null
  }
  try {
    const token = new URL(actionLink).searchParams.get("token")
    return token && token.length > 0 ? token : null
  } catch {
    return null
  }
}

/**
 * Supabase `action_link` pointează spre `/auth/v1/verify` (OTP se arde la preview WhatsApp / 403 PKCE).
 * Păstrăm tokenul din `properties.action_link` / `hashed_token` pe domeniul aplicației.
 */
export function whatsAppInviteUrlFromGenerateLink(payload: unknown, siteUrl = inviteSiteUrl()): string | null {
  const actionLink = readActionLink(payload)
  const hashedToken = readHashedToken(payload, actionLink)
  if (!hashedToken) {
    return null
  }
  const params = new URLSearchParams({
    token_hash: hashedToken,
    type: "recovery",
  })
  return `${siteUrl}${ACTIVARE_PATH}?${params.toString()}`
}
