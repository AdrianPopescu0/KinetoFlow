export const EXERCISE_LIBRARY_EDITOR_EMAILS = [
  "kinetic01flow@gmail.com",
  "admin@kinetoflow.ro",
] as const

/** @deprecated Folosește EXERCISE_LIBRARY_EDITOR_EMAILS — păstrat pentru importuri existente. */
export const EXERCISE_LIBRARY_EDITOR_EMAIL = EXERCISE_LIBRARY_EDITOR_EMAILS[0]

export function isExerciseLibraryEditor(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase()
  return Boolean(
    normalized &&
      EXERCISE_LIBRARY_EDITOR_EMAILS.includes(normalized as (typeof EXERCISE_LIBRARY_EDITOR_EMAILS)[number]),
  )
}

export function emailsFromAuthUser(user: {
  email?: string | null
  user_metadata?: Record<string, unknown> | null
  identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null
} | null | undefined): string[] {
  const emails = new Set<string>()
  if (user?.email) {
    emails.add(user.email)
  }
  const metaEmail = user?.user_metadata?.email
  if (typeof metaEmail === "string") {
    emails.add(metaEmail)
  }
  for (const identity of user?.identities ?? []) {
    const identityEmail = identity.identity_data?.email
    if (typeof identityEmail === "string") {
      emails.add(identityEmail)
    }
  }
  return [...emails]
}

export function authUserCanEditLibrary(
  user: {
    email?: string | null
    user_metadata?: Record<string, unknown> | null
    identities?: Array<{ identity_data?: Record<string, unknown> | null }> | null
  } | null | undefined,
): boolean {
  return emailsFromAuthUser(user).some((email) => isExerciseLibraryEditor(email))
}

export const LIBRARY_WRITE_FORBIDDEN =
  "Doar kinetic01flow@gmail.com și admin@kinetoflow.ro pot adăuga, edita sau șterge exerciții din bibliotecă."
