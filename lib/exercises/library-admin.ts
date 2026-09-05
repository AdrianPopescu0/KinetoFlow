export const EXERCISE_LIBRARY_EDITOR_EMAIL = "kinetic01flow@gmail.com"

export function isExerciseLibraryEditor(email: string | null | undefined): boolean {
  return email?.trim().toLowerCase() === EXERCISE_LIBRARY_EDITOR_EMAIL
}

export const LIBRARY_WRITE_FORBIDDEN =
  "Doar contul kinetic01flow@gmail.com poate adăuga, edita sau șterge exerciții din bibliotecă."
