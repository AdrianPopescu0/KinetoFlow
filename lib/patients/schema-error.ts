export function isMissingSchemaObject(
  error: { message?: string; code?: string } | null | undefined,
  name: string,
): boolean {
  if (!error) {
    return false
  }
  const needle = name.toLowerCase()
  const message = (error.message ?? "").toLowerCase()
  const code = error.code ?? ""
  if (!message.includes(needle)) {
    return false
  }
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    code === "PGRST204" ||
    message.includes("schema cache") ||
    message.includes("could not find") ||
    message.includes("does not exist")
  )
}

export function isMissingClinicalNotesColumn(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  return isMissingSchemaObject(error, "clinical_notes")
}

export function isMissingPatientNotesTable(
  error: { message?: string; code?: string } | null | undefined,
): boolean {
  return isMissingSchemaObject(error, "patient_notes")
}
