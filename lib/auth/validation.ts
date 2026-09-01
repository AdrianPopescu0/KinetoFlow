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
