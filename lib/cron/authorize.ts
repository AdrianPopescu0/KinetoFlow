import { timingSafeEqual } from "node:crypto"

function buffersEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

function secretTokenMatches(token: string, secret: string): boolean {
  return buffersEqual(token, secret)
}

/**
 * Vercel și cron-job.org trimit `Authorization: Bearer ${CRON_SECRET}`.
 * Acceptă și spații accidentale / `bearer` lowercase, dar respinge lipsa prefixului
 * pe acest header (ca să nu confunde un Bearer malformat cu un secret brut).
 */
export function authorizationMatchesCronSecret(
  authorization: string | null,
  cronSecret: string | undefined,
): boolean {
  if (!cronSecret || !authorization) {
    return false
  }
  if (authorization === `Bearer ${cronSecret}`) {
    return true
  }

  const secret = cronSecret.trim()
  if (!secret) {
    return false
  }

  const header = authorization.trim()
  if (header === `Bearer ${secret}`) {
    return true
  }

  const match = /^Bearer\s+(.+)$/i.exec(header)
  const token = match?.[1]?.trim()
  if (!token) {
    return false
  }
  return secretTokenMatches(token, secret)
}

/** Header custom (cron-job.org → Advanced): valoarea e secretul sau `Bearer …`. */
export function headerMatchesCronSecret(value: string | null, cronSecret: string | undefined): boolean {
  if (!cronSecret || !value) {
    return false
  }
  const secret = cronSecret.trim()
  const token = value.trim()
  if (!secret || !token) {
    return false
  }
  if (secretTokenMatches(token, secret)) {
    return true
  }
  return authorizationMatchesCronSecret(token, secret)
}

const CRON_SECRET_HEADERS = ["x-cron-secret", "x-cron-job-secret", "x-api-key"] as const

export function isAuthorizedCronRequest(request: Request, cronSecret = process.env.CRON_SECRET): boolean {
  if (authorizationMatchesCronSecret(request.headers.get("authorization"), cronSecret)) {
    return true
  }
  for (const name of CRON_SECRET_HEADERS) {
    if (headerMatchesCronSecret(request.headers.get(name), cronSecret)) {
      return true
    }
  }
  return false
}

/** Invocare din Vercel Cron (header-ele sunt în plus față de Bearer; nu înlocuiesc secretul). */
export function isVercelCronInvocation(request: Request): boolean {
  if (request.headers.get("x-vercel-cron") === "1") {
    return true
  }
  if (request.headers.get("x-vercel-cron-schedule")) {
    return true
  }
  const userAgent = request.headers.get("user-agent") ?? ""
  return /\bvercel-cron\b/i.test(userAgent)
}

export function shouldRunDailyProgressReset(options: {
  force: boolean
  vercelCron: boolean
  inMidnightWindow: boolean
}): boolean {
  return options.force || options.vercelCron || options.inMidnightWindow
}

export function cronErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return "Eroare necunoscută."
}
