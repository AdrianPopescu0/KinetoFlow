import "server-only"

import { Resend } from "resend"

import { isEmailAlreadyRegisteredError } from "@/lib/auth/email-confirmed"
import {
  EMAIL_OTP_MAX_ATTEMPTS,
  EMAIL_OTP_RESEND_MS,
  EMAIL_OTP_TTL_MS,
  generateEmailOtpLinkToken,
  hashEmailOtpCode,
  hashEmailOtpLinkToken,
  hashesMatch,
  isEmailOtpCode,
  normalizeAuthEmail,
  otpExpiresAt,
  parseAuthEmailOtpPurpose,
  type AuthEmailOtpPurpose,
} from "@/lib/auth/email-otp"
import { authOtpFromAddress, buildAuthOtpEmail } from "@/lib/auth/email-otp-email"
import { appOrigin } from "@/lib/auth/origin"
import { loginHref } from "@/lib/auth/paths"
import { findAuthUserIdByEmail } from "@/lib/auth/verified-password-session"
import { formatSupabaseError } from "@/lib/supabase/format-error"
import { createServiceRoleClient } from "@/utils/supabase/admin"

const VERIFIED_OTP_COOKIE = "kf_otp_verified"

export { VERIFIED_OTP_COOKIE }

type OtpRow = {
  id: string
  email: string
  code_hash: string
  link_token_hash: string
  purpose: string
  expires_at: string
  consumed_at: string | null
  attempt_count: number
  created_at: string
}

export type IssueAuthEmailOtpResult =
  | { ok: true; devCode?: string }
  | { ok: false; error: string; status?: number }

export type ConsumeAuthEmailOtpResult = { ok: true; email: string } | { ok: false; error: string }

function isMissingOtpTable(error: { message?: string; code?: string } | null): boolean {
  if (!error) {
    return false
  }
  const message = (error.message ?? "").toLowerCase()
  return (
    error.code === "42P01" ||
    error.code === "PGRST205" ||
    (message.includes("auth_email_otps") &&
      (message.includes("does not exist") || message.includes("schema cache") || message.includes("could not find")))
  )
}

const MISSING_OTP_TABLE =
  "Tabela pentru codurile de email lipsește. Rulează sql/026_auth_email_otps.sql în Supabase SQL Editor."

function missingTableError(): IssueAuthEmailOtpResult {
  return {
    ok: false,
    error: MISSING_OTP_TABLE,
    status: 503,
  }
}

function allowDevCodeInResponse(): boolean {
  return process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY?.trim()
}

async function sendAuthOtpEmail(input: {
  email: string
  code: string
  purpose: AuthEmailOtpPurpose
  loginUrl: string
}): Promise<{ sent: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    console.info("[auth-otp] RESEND_API_KEY lipsește. Cod local (nu se trimite email):", input.code, input.email)
    return { sent: false }
  }

  const resend = new Resend(apiKey)
  const content = buildAuthOtpEmail({
    code: input.code,
    purpose: input.purpose,
    loginUrl: input.loginUrl,
  })

  const { error } = await resend.emails.send({
    from: authOtpFromAddress(),
    to: [input.email],
    subject: content.subject,
    html: content.html,
    text: content.text,
  })

  if (error) {
    return { sent: false, error: error.message }
  }
  return { sent: true }
}

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră în cont din tabul de autentificare."

async function supabaseEmailOtpCode(input: {
  email: string
  purpose: AuthEmailOtpPurpose
  password?: string
}): Promise<{ code: string } | { error: string; status?: number }> {
  const admin = createServiceRoleClient()

  if (input.purpose === "register") {
    const password = input.password
    if (!password) {
      return { error: "Parola lipsește. Revino la formularul de înregistrare.", status: 400 }
    }

    try {
      const existingId = await findAuthUserIdByEmail(input.email)
      if (existingId) {
        const { data: existing } = await admin.auth.admin.getUserById(existingId)
        if (existing.user?.email_confirmed_at) {
          return { error: EXISTING_ACCOUNT_MESSAGE, status: 409 }
        }
        const { data, error } = await admin.auth.admin.generateLink({
          type: "magiclink",
          email: input.email,
        })
        const otp = data.properties?.email_otp
        if (error || !otp || !isEmailOtpCode(otp)) {
          return { error: EXISTING_ACCOUNT_MESSAGE, status: 409 }
        }
        return { code: otp }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut verifica emailul."
      if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
      }
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email: input.email,
      password,
    })
    if (error) {
      if (isEmailAlreadyRegisteredError(error)) {
        return { error: EXISTING_ACCOUNT_MESSAGE, status: 409 }
      }
      return { error: formatSupabaseError(error) }
    }
    const otp = data.properties?.email_otp
    if (otp && isEmailOtpCode(otp)) {
      return { code: otp }
    }
    return { error: "Nu am putut genera codul de confirmare. Încearcă din nou." }
  }

  return { error: "Codul de 6 cifre se trimite doar la crearea contului. Intră cu email și parolă." }
}

export async function issueAuthEmailOtp(input: {
  email: string
  purpose?: unknown
  password?: string
}): Promise<IssueAuthEmailOtpResult> {
  const email = normalizeAuthEmail(input.email)
  if (!email) {
    return { ok: false, error: "Introdu o adresă de email validă.", status: 400 }
  }
  const purpose = parseAuthEmailOtpPurpose(input.purpose)
  if (purpose !== "register") {
    return {
      ok: false,
      error: "Codul de 6 cifre se trimite doar la crearea contului. Intră cu email și parolă.",
      status: 400,
    }
  }

  try {
    const admin = createServiceRoleClient()
    const now = new Date()

    const { data: latest, error: latestError } = await admin
      .from("auth_email_otps")
      .select("id, created_at, consumed_at, expires_at")
      .eq("email", email)
      .eq("purpose", purpose)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError && isMissingOtpTable(latestError)) {
      return missingTableError()
    }
    if (latestError) {
      return { ok: false, error: formatSupabaseError(latestError) }
    }

    if (
      latest &&
      !latest.consumed_at &&
      new Date(latest.created_at).getTime() > now.getTime() - EMAIL_OTP_RESEND_MS
    ) {
      return { ok: true }
    }

    if (latest && !latest.consumed_at) {
      await admin.from("auth_email_otps").update({ consumed_at: now.toISOString() }).eq("id", latest.id)
    }

    const issued = await supabaseEmailOtpCode({ email, purpose, password: input.password })
    if ("error" in issued) {
      return { ok: false, error: issued.error, status: issued.status }
    }
    const code = issued.code
    const linkToken = generateEmailOtpLinkToken()
    const expiresAt = otpExpiresAt(now, EMAIL_OTP_TTL_MS)
    const origin = await appOrigin()
    const loginUrl = `${origin}${loginHref(purpose === "register" ? "signup" : "signin")}`

    const { data: inserted, error: insertError } = await admin
      .from("auth_email_otps")
      .insert({
        email,
        code_hash: hashEmailOtpCode(email, code),
        link_token_hash: hashEmailOtpLinkToken(linkToken),
        purpose,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single()

    if (insertError) {
      if (isMissingOtpTable(insertError)) {
        return missingTableError()
      }
      return { ok: false, error: formatSupabaseError(insertError) }
    }

    const sent = await sendAuthOtpEmail({ email, code, purpose, loginUrl })
    if (sent.error) {
      if (inserted?.id) {
        await admin.from("auth_email_otps").update({ consumed_at: now.toISOString() }).eq("id", inserted.id)
      }
      return { ok: false, error: `Nu am putut trimite emailul: ${sent.error}` }
    }

    return allowDevCodeInResponse() ? { ok: true, devCode: code } : { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut genera codul de acces."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { ok: false, error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { ok: false, error: message }
  }
}

async function loadActiveOtpByEmail(
  admin: ReturnType<typeof createServiceRoleClient>,
  email: string,
): Promise<{ row: OtpRow | null; error: ConsumeAuthEmailOtpResult | null }> {
  const { data, error } = await admin
    .from("auth_email_otps")
    .select("id, email, code_hash, link_token_hash, purpose, expires_at, consumed_at, attempt_count, created_at")
    .eq("email", email)
    .is("consumed_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isMissingOtpTable(error)) {
      return { row: null, error: { ok: false, error: MISSING_OTP_TABLE } }
    }
    return { row: null, error: { ok: false, error: formatSupabaseError(error) } }
  }

  return { row: (data as OtpRow | null) ?? null, error: null }
}

async function failAttempt(
  admin: ReturnType<typeof createServiceRoleClient>,
  row: OtpRow,
): Promise<ConsumeAuthEmailOtpResult> {
  const nextAttempts = row.attempt_count + 1
  const consumed = nextAttempts >= EMAIL_OTP_MAX_ATTEMPTS ? new Date().toISOString() : null
  await admin
    .from("auth_email_otps")
    .update({ attempt_count: nextAttempts, consumed_at: consumed })
    .eq("id", row.id)
  return { ok: false, error: "Cod invalid sau expirat." }
}

export async function consumeAuthEmailOtp(input: {
  email?: string | null
  code?: string | null
  linkToken?: string | null
}): Promise<ConsumeAuthEmailOtpResult> {
  const code = typeof input.code === "string" ? input.code.trim() : ""
  const linkToken = typeof input.linkToken === "string" ? input.linkToken.trim() : ""
  const email = normalizeAuthEmail(input.email ?? "")

  if (!code && !linkToken) {
    return { ok: false, error: "Introdu codul primit pe email." }
  }

  try {
    const admin = createServiceRoleClient()

    if (linkToken) {
      const tokenHash = hashEmailOtpLinkToken(linkToken)
      const { data, error } = await admin
        .from("auth_email_otps")
        .select("id, email, code_hash, link_token_hash, purpose, expires_at, consumed_at, attempt_count, created_at")
        .eq("link_token_hash", tokenHash)
        .maybeSingle()

      if (error) {
        if (isMissingOtpTable(error)) {
          return { ok: false, error: MISSING_OTP_TABLE }
        }
        return { ok: false, error: formatSupabaseError(error) }
      }

      const row = data as OtpRow | null
      if (!row || row.consumed_at || new Date(row.expires_at).getTime() <= Date.now()) {
        return { ok: false, error: "Linkul este invalid sau a expirat." }
      }
      if (!hashesMatch(row.link_token_hash, tokenHash)) {
        return { ok: false, error: "Linkul este invalid sau a expirat." }
      }

      await admin.from("auth_email_otps").update({ consumed_at: new Date().toISOString() }).eq("id", row.id)
      return { ok: true, email: row.email }
    }

    if (!email || !isEmailOtpCode(code)) {
      return { ok: false, error: "Introdu codul de 6 cifre primit pe email." }
    }

    const loaded = await loadActiveOtpByEmail(admin, email)
    if (loaded.error) {
      return loaded.error
    }
    if (!loaded.row) {
      return { ok: false, error: "Cod invalid sau expirat." }
    }

    const expected = hashEmailOtpCode(email, code)
    if (!hashesMatch(loaded.row.code_hash, expected)) {
      return failAttempt(admin, loaded.row)
    }

    await admin.from("auth_email_otps").update({ consumed_at: new Date().toISOString() }).eq("id", loaded.row.id)
    return { ok: true, email }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut verifica codul."
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { ok: false, error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { ok: false, error: message }
  }
}
