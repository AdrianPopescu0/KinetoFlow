import { evaluateRegisterPassword, REGISTER_PASSWORD_HINT } from "@/lib/auth/password"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AUTH_ERROR_MESSAGE = "Email sau parolă incorectă"

export type AuthCredentials = {
  email: string
  password: string
}

export function parseLoginCredentials(formData: FormData): AuthCredentials | null {
  const emailRaw = formData.get("email")
  const passwordRaw = formData.get("password")

  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
    return null
  }

  const email = emailRaw.trim().toLowerCase()
  const password = passwordRaw

  if (!EMAIL_PATTERN.test(email) || password.length === 0) {
    return null
  }

  return { email, password }
}

export const REGISTER_ERROR_MESSAGE = "Nu am putut crea contul. Verifică datele și încearcă din nou."

export function parseRegisterCredentials(formData: FormData): AuthCredentials | { error: string } {
  const emailRaw = formData.get("email")
  const passwordRaw = formData.get("password")

  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
    return { error: REGISTER_ERROR_MESSAGE }
  }

  const email = emailRaw.trim().toLowerCase()
  const password = passwordRaw

  if (!EMAIL_PATTERN.test(email)) {
    return { error: "Introdu o adresă de email validă." }
  }

  if (!evaluateRegisterPassword(password).isValid) {
    return { error: REGISTER_PASSWORD_HINT }
  }

  return { email, password }
}

export function parseRecoveryEmail(formData: FormData): string | null {
  const emailRaw = formData.get("email")

  if (typeof emailRaw !== "string") {
    return null
  }

  const email = emailRaw.trim().toLowerCase()

  if (!EMAIL_PATTERN.test(email)) {
    return null
  }

  return email
}
