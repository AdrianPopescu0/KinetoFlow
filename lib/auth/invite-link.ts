import { appOrigin } from "@/lib/auth/origin"
import { SET_PASSWORD_PATH } from "@/lib/auth/paths"

export const ACTIVARE_PATH = "/auth/activare"

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, "")
}

/** Preview-urile Vercel pe branch nu sunt domeniul aplicației. */
export function isUnusableInviteOrigin(value: string): boolean {
  try {
    const host = new URL(value).hostname.toLowerCase()
    return host.endsWith(".vercel.app") && host.includes("-git-")
  } catch {
    return value.includes("-git-") && value.includes("vercel.app")
  }
}

export function inviteSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (fromEnv) {
    const origin = stripTrailingSlash(fromEnv)
    if (!isUnusableInviteOrigin(origin)) {
      return origin
    }
  }
  return "http://127.0.0.1:43123"
}

/** Originea reală a request-ului (domeniul pe care rulează aplicația), nu un fallback Vercel. */
export async function resolveInviteSiteUrl(): Promise<string> {
  const origin = await appOrigin()
  if (!isUnusableInviteOrigin(origin)) {
    return stripTrailingSlash(origin)
  }
  return inviteSiteUrl()
}

export function recoveryRedirectTo(siteUrl = inviteSiteUrl()): string {
  return `${stripTrailingSlash(siteUrl)}/auth/callback?next=${SET_PASSWORD_PATH}`
}

export function therapistInviteUrl(siteUrl: string, tokenHash: string): string {
  const params = new URLSearchParams({
    token_hash: tokenHash,
    type: "recovery",
  })
  return `${stripTrailingSlash(siteUrl)}${ACTIVARE_PATH}?${params.toString()}`
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
    const params = new URL(actionLink).searchParams
    const fromHash = params.get("token_hash") ?? params.get("token")
    return fromHash && fromHash.length > 0 ? fromHash : null
  } catch {
    return null
  }
}

/**
 * Nu trimitem `action_link` Supabase (`/auth/v1/verify` + redirect Vercel).
 * Construim `/auth/activare?token_hash=…` pe domeniul aplicației.
 */
export function whatsAppInviteUrlFromGenerateLink(payload: unknown, siteUrl = inviteSiteUrl()): string | null {
  const actionLink = readActionLink(payload)
  const hashedToken = readHashedToken(payload, actionLink)
  if (!hashedToken) {
    return null
  }
  return therapistInviteUrl(siteUrl, hashedToken)
}
