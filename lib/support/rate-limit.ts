import "server-only"

import { headers } from "next/headers"

const WINDOW_MS = 60 * 60 * 1000
const MAX_SUBMISSIONS = 3

const submissionsByIp = new Map<string, number[]>()

export async function clientIpFromHeaders(): Promise<string> {
  const headerStore = await headers()
  const forwarded = headerStore.get("x-forwarded-for")
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim()
    if (first) {
      return first
    }
  }
  const realIp = headerStore.get("x-real-ip")?.trim()
  if (realIp) {
    return realIp
  }
  const cfIp = headerStore.get("cf-connecting-ip")?.trim()
  if (cfIp) {
    return cfIp
  }
  return "unknown"
}

export function consumeSupportRateLimit(ip: string): boolean {
  const now = Date.now()
  const cutoff = now - WINDOW_MS
  const recent = (submissionsByIp.get(ip) ?? []).filter((stamp) => stamp > cutoff)
  if (recent.length >= MAX_SUBMISSIONS) {
    submissionsByIp.set(ip, recent)
    return false
  }
  recent.push(now)
  submissionsByIp.set(ip, recent)
  return true
}
