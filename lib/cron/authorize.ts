import { timingSafeEqual } from "node:crypto"

function buffersEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

/**
 * Vercel trimite `Authorization: Bearer ${CRON_SECRET}`.
 * Acceptă și spații accidentale / `bearer` lowercase, dar respinge lipsa prefixului.
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
  return buffersEqual(token, secret)
}

export function isAuthorizedCronRequest(request: Request, cronSecret = process.env.CRON_SECRET): boolean {
  return authorizationMatchesCronSecret(request.headers.get("authorization"), cronSecret)
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
