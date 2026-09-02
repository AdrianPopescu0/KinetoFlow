export function formatSupabaseError(error: {
  message?: string
  details?: string
  hint?: string
  code?: string
}): string {
  const parts: string[] = []
  if (error.message) {
    parts.push(error.message)
  }
  if (error.details) {
    parts.push(`details: ${error.details}`)
  }
  if (error.code) {
    parts.push(`code: ${error.code}`)
  }
  if (error.hint) {
    parts.push(`hint: ${error.hint}`)
  }
  return parts.length > 0 ? parts.join(" — ") : "Eroare necunoscută de la Supabase."
}
