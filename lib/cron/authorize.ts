import { timingSafeEqual } from "node:crypto"

function buffersEqual(left: string, right: string): boolean {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  if (a.length !== b.length) {
    return false
  }
  return timingSafeEqual(a, b)
}

/** Scoate BOM, newline, spații și ghilimelele puse din greșeală în Vercel / .env. */
export function readCronSecret(raw: string | undefined | null = process.env.CRON_SECRET): string | undefined {
  if (raw == null) {
    return undefined
  }
  let value = raw.replace(/^\uFEFF/, "").trim()
  if (
    (value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
    (value.startsWith("'") && value.endsWith("'") && value.length >= 2)
  ) {
    value = value.slice(1, -1).trim()
  }
  return value.length > 0 ? value : undefined
}

function stripWrappingQuotes(value: string): string {
  let next = value.replace(/^\uFEFF/, "").trim()
  if (
    (next.startsWith('"') && next.endsWith('"') && next.length >= 2) ||
    (next.startsWith("'") && next.endsWith("'") && next.length >= 2)
  ) {
    next = next.slice(1, -1).trim()
  }
  return next
}

/**
 * cron-job.org pune valoarea header-ului ca `Bearer SECRET`, uneori doar `SECRET`,
 * uneori `Bearer Bearer SECRET` dacă prefixul e scris și în UI.
 */
export function unwrapCronAuthToken(header: string): string {
  let value = stripWrappingQuotes(header)
  for (let i = 0; i < 3; i += 1) {
    const match = /^Bearer\s+(.+)$/i.exec(value)
    if (!match?.[1]) {
      break
    }
    value = stripWrappingQuotes(match[1])
  }
  return value
}

export function authorizationMatchesCronSecret(
  authorization: string | null,
  cronSecret: string | undefined,
): boolean {
  const secret = readCronSecret(cronSecret)
  if (!secret || !authorization) {
    return false
  }
  const token = unwrapCronAuthToken(authorization)
  if (!token) {
    return false
  }
  return buffersEqual(token, secret)
}

/** Header custom (cron-job.org → Advanced): valoarea e secretul sau `Bearer …`. */
export function headerMatchesCronSecret(value: string | null, cronSecret: string | undefined): boolean {
  return authorizationMatchesCronSecret(value, cronSecret)
}

const CRON_SECRET_HEADERS = ["x-cron-secret", "x-cron-job-secret", "x-api-key"] as const

export function cronAuthHeaderValue(request: Request): string | null {
  const authorization = request.headers.get("authorization")
  if (authorization?.trim()) {
    return authorization
  }
  for (const name of CRON_SECRET_HEADERS) {
    const value = request.headers.get(name)
    if (value?.trim()) {
      return value
    }
  }
  return null
}

export function isAuthorizedCronRequest(request: Request, cronSecret = process.env.CRON_SECRET): boolean {
  const secret = readCronSecret(cronSecret)
  const header = cronAuthHeaderValue(request)
  return authorizationMatchesCronSecret(header, secret)
}

export type CronAuthFailureReason = "missing_secret" | "missing_header" | "mismatch"

export function describeCronAuthFailure(
  request: Request,
  cronSecret = process.env.CRON_SECRET,
): { reason: CronAuthFailureReason; message: string } {
  const secret = readCronSecret(cronSecret)
  if (!secret) {
    return {
      reason: "missing_secret",
      message: "CRON_SECRET nu este setat pe server (Vercel → Settings → Environment Variables).",
    }
  }
  const header = cronAuthHeaderValue(request)
  if (!header) {
    return {
      reason: "missing_header",
      message: "Lipsește header-ul Authorization (sau X-Cron-Secret).",
    }
  }
  return {
    reason: "mismatch",
    message: "Secretul din Authorization nu se potrivește cu CRON_SECRET (verifică ghilimelele și prefixul Bearer).",
  }
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
