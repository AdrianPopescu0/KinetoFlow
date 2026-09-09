export const REGISTER_CONFIRM_INFO =
  "Ți-am trimis un email de confirmare. Deschide inbox-ul (și spam-ul), apasă linkul din mesaj, apoi revino aici ca să intri în cont."

export const EMAIL_CONFIRM_REQUIRED =
  "Adresa de email nu este confirmată. Deschide linkul primit la înregistrare, apoi încearcă din nou."

export function isEmailConfirmedUser(user: {
  email_confirmed_at?: string | null
  identities?: Array<{ provider?: string | null }> | null
} | null | undefined): boolean {
  if (!user) {
    return false
  }
  if (user.email_confirmed_at) {
    return true
  }
  return (user.identities ?? []).some((identity) => {
    const provider = identity.provider ?? ""
    return provider.length > 0 && provider !== "email"
  })
}

export function isEmailNotConfirmedAuthError(error: {
  code?: string
  message?: string
} | null | undefined): boolean {
  if (!error) {
    return false
  }
  if (error.code === "email_not_confirmed") {
    return true
  }
  const message = (error.message ?? "").toLowerCase()
  return message.includes("email not confirmed") || message.includes("email_not_confirmed")
}

export function isInvalidLoginCredentialsError(error: {
  code?: string
  message?: string
} | null | undefined): boolean {
  if (!error) {
    return false
  }
  const code = (error.code ?? "").toLowerCase()
  const message = (error.message ?? "").toLowerCase()
  return (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid email or password")
  )
}

export function isEmailAlreadyRegisteredError(error: {
  code?: string
  message?: string
} | null | undefined): boolean {
  if (!error) {
    return false
  }
  const code = (error.code ?? "").toLowerCase()
  const message = (error.message ?? "").toLowerCase()
  return (
    code.includes("email_exists") ||
    code.includes("user_already_exists") ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already exists")
  )
}

/**
 * După OTP pe email, „Invalid login credentials” înseamnă adesea utilizator
 * neconfirmat (protecție anti-enumerare), nu parolă greșită.
 */
export function shouldConfirmEmailAndRetrySignIn(params: {
  error: { code?: string; message?: string } | null | undefined
  emailJustVerified: boolean
}): boolean {
  if (!params.error) {
    return false
  }
  if (isEmailNotConfirmedAuthError(params.error)) {
    return true
  }
  return params.emailJustVerified && isInvalidLoginCredentialsError(params.error)
}
