export const EXERCISE_LIBRARY_EDITOR_EMAILS = [
  "kinetic01flow@gmail.com",
  "admin@kinetoflow.ro",
] as const

/** @deprecated Folosește EXERCISE_LIBRARY_EDITOR_EMAILS — păstrat pentru importuri existente. */
export const EXERCISE_LIBRARY_EDITOR_EMAIL = EXERCISE_LIBRARY_EDITOR_EMAILS[0]

export function isExerciseLibraryEditor(email: string | null | undefined): boolean {
  const normalized = email?.trim().toLowerCase()
  return Boolean(normalized && EXERCISE_LIBRARY_EDITOR_EMAILS.includes(normalized as (typeof EXERCISE_LIBRARY_EDITOR_EMAILS)[number]))
}

export const LIBRARY_WRITE_FORBIDDEN =
  "Doar kinetic01flow@gmail.com și admin@kinetoflow.ro pot adăuga, edita sau șterge exerciții din bibliotecă."
