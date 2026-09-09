import {
  EMAIL_CONFIRM_REQUIRED,
  isEmailConfirmedUser,
  shouldConfirmEmailAndRetrySignIn,
} from "@/lib/auth/email-confirmed"
import { createServiceRoleClient } from "@/utils/supabase/admin"
import { createClient } from "@/utils/supabase/server"

export type VerifiedSignInResult =
  | { ok: true }
  | { ok: false; kind: "credentials" }
  | { ok: false; kind: "unconfirmed" }
  | { ok: false; kind: "confirm_failed"; message: string }

const USERS_PER_PAGE = 200
const MAX_USER_PAGES = 20

export async function confirmAuthUserEmailById(userId: string): Promise<VerifiedSignInResult> {
  try {
    const admin = createServiceRoleClient()
    const { error } = await admin.auth.admin.updateUserById(userId, { email_confirm: true })
    if (error) {
      return { ok: false, kind: "confirm_failed", message: error.message }
    }
    return { ok: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut confirma emailul."
    return { ok: false, kind: "confirm_failed", message }
  }
}

export async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const admin = createServiceRoleClient()
  const normalized = email.trim().toLowerCase()
  let page = 1

  while (page <= MAX_USER_PAGES) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE })
    if (error) {
      throw new Error(error.message)
    }
    const match = data.users.find((user) => (user.email ?? "").toLowerCase() === normalized)
    if (match) {
      return match.id
    }
    if (data.users.length < USERS_PER_PAGE) {
      break
    }
    page += 1
  }

  return null
}

async function confirmAuthUserEmail(params: {
  email: string
  userId?: string | null
}): Promise<VerifiedSignInResult> {
  try {
    const userId = params.userId ?? (await findAuthUserIdByEmail(params.email))
    if (!userId) {
      return { ok: false, kind: "credentials" }
    }
    return await confirmAuthUserEmailById(userId)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nu am putut confirma emailul."
    return { ok: false, kind: "confirm_failed", message }
  }
}

/**
 * Autentifică cu email/parolă după ce adresa a fost dovedită prin OTP.
 * Confirmă utilizatorul în Auth (service role) și reîncearcă o dată, ca JWT-ul
 * să aibă `email_confirmed_at` — altfel primul login eșuează cu „parolă greșită”.
 */
function signedInUser(result: {
  data: {
    user?: {
      id: string
      email_confirmed_at?: string | null
      identities?: Array<{ provider?: string | null }> | null
    } | null
    session?: {
      user?: {
        id: string
        email_confirmed_at?: string | null
        identities?: Array<{ provider?: string | null }> | null
      } | null
    } | null
  }
}) {
  return result.data.user ?? result.data.session?.user ?? null
}

export async function signInAfterEmailVerified(params: {
  email: string
  password: string
  userId?: string | null
  emailJustVerified: boolean
}): Promise<VerifiedSignInResult> {
  const supabase = await createClient()
  const email = params.email.trim().toLowerCase()
  const password = params.password

  async function signIn() {
    return supabase.auth.signInWithPassword({ email, password })
  }

  let result = await signIn()

  if (!result.error) {
    const user = signedInUser(result)
    if (isEmailConfirmedUser(user)) {
      return { ok: true }
    }

    const confirmed = await confirmAuthUserEmail({ email, userId: params.userId ?? user?.id })
    await supabase.auth.signOut()
    if (!confirmed.ok) {
      return confirmed.kind === "confirm_failed" ? confirmed : { ok: false, kind: "unconfirmed" }
    }

    result = await signIn()
    if (result.error || !isEmailConfirmedUser(signedInUser(result))) {
      if (!result.error) {
        await supabase.auth.signOut()
      }
      return { ok: false, kind: "unconfirmed" }
    }
    return { ok: true }
  }

  if (!shouldConfirmEmailAndRetrySignIn({ error: result.error, emailJustVerified: params.emailJustVerified })) {
    return { ok: false, kind: "credentials" }
  }

  const confirmed = await confirmAuthUserEmail({ email, userId: params.userId })
  if (!confirmed.ok) {
    return confirmed
  }

  result = await signIn()
  if (result.error) {
    return { ok: false, kind: "credentials" }
  }
  if (!isEmailConfirmedUser(signedInUser(result))) {
    await supabase.auth.signOut()
    return { ok: false, kind: "unconfirmed" }
  }
  return { ok: true }
}

export function verifiedSignInFailureMessage(
  result: Extract<VerifiedSignInResult, { ok: false }>,
  fallback: string,
): { error?: string; info?: string } {
  if (result.kind === "unconfirmed") {
    return { info: EMAIL_CONFIRM_REQUIRED }
  }
  if (result.kind === "confirm_failed") {
    if (result.message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return { error: "Lipsește cheia de serviciu. Adaugă SUPABASE_SERVICE_ROLE_KEY în .env.local." }
    }
    return { error: result.message }
  }
  return { error: fallback }
}
