import "server-only"

import { Resend } from "resend"

import { isEmailAlreadyRegisteredError, isIncompleteEmailSignup } from "@/lib/auth/email-confirmed"
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
import {
  describeOtpMailerError,
  logOtpMailerError,
  logOtpMailerInfo,
} from "@/lib/auth/email-otp-mailer"
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
}): Promise<{ sent: boolean; error?: string; status?: number }> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = authOtpFromAddress()

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      const described = describeOtpMailerError("config", "RESEND_API_KEY lipsește")
      logOtpMailerError("email.neconfigurat", {
        via: "resend.emails.send",
        to: input.email,
        from,
        purpose: input.purpose,
        detail: described.logMessage,
      })
      return { sent: false, error: described.userMessage, status: described.status }
    }
    logOtpMailerInfo("email.local-fara-resend", {
      via: "console",
      to: input.email,
      from,
      purpose: input.purpose,
      note: "RESEND_API_KEY lipsește. Nu folosim signInWithOtp / auth.resend / mailer-ul de test Supabase.",
      code: input.code,
    })
    return { sent: false }
  }

  const content = buildAuthOtpEmail({
    code: input.code,
    purpose: input.purpose,
    loginUrl: input.loginUrl,
  })

  try {
    logOtpMailerInfo("email.trimite", {
      via: "resend.emails.send",
      to: input.email,
      from,
      purpose: input.purpose,
    })
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: [input.email],
      subject: content.subject,
      html: content.html,
      text: content.text,
    })
    if (error) {
      const described = describeOtpMailerError("resend", error)
      logOtpMailerError("email.resend-esuat", {
        via: "resend.emails.send",
        to: input.email,
        from,
        purpose: input.purpose,
        kind: described.kind,
        status: described.status,
        detail: described.logMessage,
      })
      return { sent: false, error: described.userMessage, status: described.status }
    }
    logOtpMailerInfo("email.trimis", {
      via: "resend.emails.send",
      to: input.email,
      from,
      purpose: input.purpose,
      id: data?.id ?? null,
    })
    return { sent: true }
  } catch (error) {
    const described = describeOtpMailerError("resend", error)
    logOtpMailerError("email.resend-exceptie", {
      via: "resend.emails.send",
      to: input.email,
      from,
      purpose: input.purpose,
      kind: described.kind,
      status: described.status,
      detail: described.logMessage,
    })
    return { sent: false, error: described.userMessage, status: described.status }
  }
}

const EXISTING_ACCOUNT_MESSAGE =
  "Există deja un cont cu acest email. Intră în cont din tabul de autentificare."

const OTP_REGENERATE_ERROR =
  "Nu am putut genera un cod nou. Apasă „Retrimite codul de confirmare”."

async function userHasClinicProfile(
  admin: ReturnType<typeof createServiceRoleClient>,
  userId: string,
): Promise<boolean> {
  const { data } = await admin.from("clinic_profiles").select("user_id").eq("user_id", userId).maybeSingle()
  return Boolean(data && typeof data.user_id === "string")
}

async function loadAuthUserByEmail(email: string) {
  const existingId = await findAuthUserIdByEmail(email)
  if (!existingId) {
    return null
  }
  const admin = createServiceRoleClient()
  const { data } = await admin.auth.admin.getUserById(existingId)
  return data.user ?? null
}

async function generateAuthEmailOtpLink(input: {
  type: "signup" | "magiclink" | "recovery"
  email: string
  password?: string
}): Promise<{ code: string } | { error: string; status?: number }> {
  const admin = createServiceRoleClient()
  try {
    logOtpMailerInfo("auth.generateLink", {
      via: "auth.admin.generateLink",
      type: input.type,
      email: input.email,
      note: "Nu trimite email. Nu folosim signInWithOtp sau auth.resend.",
    })
    const { data, error } =
      input.type === "signup"
        ? await admin.auth.admin.generateLink({
            type: "signup",
            email: input.email,
            password: input.password ?? "",
          })
        : await admin.auth.admin.generateLink({
            type: input.type,
            email: input.email,
          })
    if (error) {
      const described = describeOtpMailerError("supabase", error)
      logOtpMailerError("auth.generateLink-esuat", {
        via: "auth.admin.generateLink",
        type: input.type,
        email: input.email,
        kind: described.kind,
        status: described.status,
        detail: described.logMessage,
        supabase: formatSupabaseError(error),
      })
      if (isEmailAlreadyRegisteredError(error)) {
        return { error: formatSupabaseError(error), status: 409 }
      }
      return {
        error: described.kind === "provider" ? formatSupabaseError(error) : described.userMessage,
        status: described.status,
      }
    }
    const otp = data.properties?.email_otp
    if (otp && isEmailOtpCode(otp)) {
      return { code: otp }
    }
    logOtpMailerError("auth.generateLink-fara-otp", {
      via: "auth.admin.generateLink",
      type: input.type,
      email: input.email,
      verificationType: data.properties?.verification_type ?? null,
    })
    return { error: "Nu am putut genera codul de confirmare. Încearcă din nou.", status: 503 }
  } catch (error) {
    const described = describeOtpMailerError("supabase", error)
    logOtpMailerError("auth.generateLink-exceptie", {
      via: "auth.admin.generateLink",
      type: input.type,
      email: input.email,
      kind: described.kind,
      status: described.status,
      detail: described.logMessage,
    })
    return { error: described.userMessage, status: described.status }
  }
}

async function generateOtpForExistingEmailUser(input: {
  email: string
  password?: string
  userId?: string
}): Promise<{ code: string } | { error: string; status?: number }> {
  const admin = createServiceRoleClient()

  if (input.userId && input.password) {
    try {
      const { error: passwordError } = await admin.auth.admin.updateUserById(input.userId, {
        password: input.password,
      })
      if (passwordError) {
        logOtpMailerError("auth.updateUser-parola", {
          via: "auth.admin.updateUserById",
          email: input.email,
          detail: formatSupabaseError(passwordError),
        })
      }
    } catch (error) {
      logOtpMailerError("auth.updateUser-parola-exceptie", {
        via: "auth.admin.updateUserById",
        email: input.email,
        detail: error instanceof Error ? error.message : String(error),
      })
    }
  }

  let lastError: { error: string; status?: number } | null = null
  for (const type of ["magiclink", "recovery"] as const) {
    const issued = await generateAuthEmailOtpLink({ type, email: input.email })
    if ("code" in issued) {
      return issued
    }
    lastError = issued
  }

  return lastError ?? { error: OTP_REGENERATE_ERROR, status: 503 }
}

async function otpForExistingRegisterUser(input: {
  email: string
  password: string
  user?: Awaited<ReturnType<typeof loadAuthUserByEmail>>
}): Promise<{ code: string } | { error: string; status?: number }> {
  const user = input.user ?? (await loadAuthUserByEmail(input.email).catch(() => null))
  if (user?.id) {
    const hasClinicProfile = await userHasClinicProfile(createServiceRoleClient(), user.id)
    if (!isIncompleteEmailSignup(user, { hasClinicProfile })) {
      return { error: EXISTING_ACCOUNT_MESSAGE, status: 409 }
    }
    return generateOtpForExistingEmailUser({
      email: input.email,
      password: input.password,
      userId: user.id,
    })
  }

  return generateOtpForExistingEmailUser({
    email: input.email,
    password: input.password,
  })
}

async function supabaseEmailOtpCode(input: {
  email: string
  purpose: AuthEmailOtpPurpose
  password?: string
}): Promise<{ code: string } | { error: string; status?: number }> {
  if (input.purpose === "register") {
    const password = input.password
    if (!password) {
      return { error: "Parola lipsește. Revino la formularul de înregistrare.", status: 400 }
    }

    try {
      const existing = await loadAuthUserByEmail(input.email)
      if (existing) {
        return otpForExistingRegisterUser({ email: input.email, password, user: existing })
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nu am putut verifica emailul."
      logOtpMailerError("auth.lookup-email", {
        via: "auth.admin.listUsers",
        email: input.email,
        detail: message,
      })
      if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
      }
    }

    const issued = await generateAuthEmailOtpLink({
      type: "signup",
      email: input.email,
      password,
    })
    if ("error" in issued) {
      if (issued.status === 409 || isEmailAlreadyRegisteredError({ message: issued.error })) {
        return otpForExistingRegisterUser({ email: input.email, password })
      }
      return issued
    }
    return issued
  }

  return { error: "Codul de 6 cifre se trimite doar la crearea contului. Intră cu email și parolă." }
}

export async function issueAuthEmailOtp(input: {
  email: string
  purpose?: unknown
  password?: string
  returnPath?: string
  /** Skip the short resend cooldown and mint a fresh Supabase Auth OTP. */
  force?: boolean
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
      !input.force &&
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
      logOtpMailerError("otp.generate-esuat", {
        via: "auth.admin.generateLink",
        email,
        status: issued.status ?? null,
        detail: issued.error,
      })
      return { ok: false, error: issued.error, status: issued.status }
    }
    const code = issued.code
    const linkToken = generateEmailOtpLinkToken()
    const expiresAt = otpExpiresAt(now, EMAIL_OTP_TTL_MS)
    const origin = await appOrigin()
    const loginUrl =
      typeof input.returnPath === "string" &&
      input.returnPath.startsWith("/") &&
      !input.returnPath.startsWith("//")
        ? `${origin}${input.returnPath}`
        : `${origin}${loginHref("signup")}`

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
      return { ok: false, error: sent.error, status: sent.status ?? 503 }
    }

    return allowDevCodeInResponse() ? { ok: true, devCode: code } : { ok: true }
  } catch (error) {
    const described = describeOtpMailerError("supabase", error)
    logOtpMailerError("otp.issue-exceptie", {
      via: "issueAuthEmailOtp",
      kind: described.kind,
      status: described.status,
      detail: described.logMessage,
    })
    const message = error instanceof Error ? error.message : described.userMessage
    if (message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { ok: false, error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { ok: false, error: described.userMessage, status: described.status }
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
