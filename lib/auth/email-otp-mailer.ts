export type OtpMailerSource = "resend" | "supabase" | "config"

export type OtpMailerKind = "rate_limit" | "smtp" | "config" | "provider" | "unknown"

export type OtpMailerDescription = {
  kind: OtpMailerKind
  source: OtpMailerSource
  logMessage: string
  userMessage: string
  status: number
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export function serializeOtpMailerError(error: unknown): string {
  if (error == null) {
    return "Eroare necunoscută de la furnizorul de email."
  }
  if (typeof error === "string") {
    return error.trim() || "Eroare necunoscută de la furnizorul de email."
  }
  if (error instanceof Error) {
    const extras = error as Error & { code?: string; status?: number; statusCode?: number; name?: string }
    const parts = [extras.name, extras.message, extras.code, extras.statusCode ?? extras.status]
      .map((part) => (part == null ? null : String(part).trim()))
      .filter((part): part is string => Boolean(part && part.length > 0))
    return parts.length > 0 ? parts.join(" — ") : "Eroare necunoscută de la furnizorul de email."
  }
  if (typeof error === "object") {
    const record = error as Record<string, unknown>
    const parts = [
      readString(record.name),
      readString(record.message),
      readString(record.code),
      readString(record.statusCode) ?? (typeof record.statusCode === "number" ? String(record.statusCode) : null),
      readString(record.status) ?? (typeof record.status === "number" ? String(record.status) : null),
      readString(record.details),
      readString(record.hint),
    ].filter((part): part is string => Boolean(part))
    if (parts.length > 0) {
      return parts.join(" — ")
    }
    try {
      return JSON.stringify(error)
    } catch {
      return "Eroare necunoscută de la furnizorul de email."
    }
  }
  return String(error)
}

function isRateLimit(text: string, status?: number): boolean {
  if (status === 429) {
    return true
  }
  return (
    text.includes("rate limit") ||
    text.includes("rate_limit") ||
    text.includes("too many requests") ||
    text.includes("over_email_send_rate_limit") ||
    text.includes("email rate limit exceeded") ||
    text.includes("429")
  )
}

function isSmtp(text: string): boolean {
  return (
    text.includes("smtp") ||
    text.includes("mailer") ||
    text.includes("error sending confirmation email") ||
    text.includes("error sending recovery email") ||
    text.includes("error sending magic link") ||
    text.includes("550") ||
    text.includes("553") ||
    text.includes("554")
  )
}

function numericStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") {
    return undefined
  }
  const record = error as { status?: unknown; statusCode?: unknown }
  if (typeof record.statusCode === "number") {
    return record.statusCode
  }
  if (typeof record.status === "number") {
    return record.status
  }
  return undefined
}

export function describeOtpMailerError(source: OtpMailerSource, error: unknown): OtpMailerDescription {
  const logMessage = serializeOtpMailerError(error)
  const text = logMessage.toLowerCase()
  const statusCode = numericStatus(error)

  if (source === "config") {
    return {
      kind: "config",
      source,
      logMessage,
      userMessage:
        "Emailul cu codul de 6 cifre nu poate fi trimis: lipsește RESEND_API_KEY. Mailer-ul de test din Supabase nu livrează aceste OTP-uri. Configurează Resend (sau SMTP Resend/SendGrid/Gmail în Auth).",
      status: 503,
    }
  }

  if (isRateLimit(text, statusCode)) {
    return {
      kind: "rate_limit",
      source,
      logMessage,
      userMessage: `Limită de trimitere (rate limit) de la ${source === "resend" ? "Resend" : "Supabase"}. Așteaptă un minut și apasă „Retrimite codul de confirmare”. Detaliu: ${logMessage}`,
      status: 429,
    }
  }

  if (isSmtp(text)) {
    return {
      kind: "smtp",
      source,
      logMessage,
      userMessage: `SMTP a refuzat emailul. Verifică furnizorul (Resend / SendGrid / Gmail). Detaliu: ${logMessage}`,
      status: 503,
    }
  }

  return {
    kind: "provider",
    source,
    logMessage,
    userMessage: `Nu am putut trimite emailul (${source}): ${logMessage}`,
    status: statusCode && statusCode >= 400 ? statusCode : 503,
  }
}

export function logOtpMailerError(event: string, details: Record<string, unknown>): void {
  console.error(`[auth-otp] ${event}`, details)
}

export function logOtpMailerInfo(event: string, details: Record<string, unknown>): void {
  console.info(`[auth-otp] ${event}`, details)
}
