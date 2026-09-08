/**
 * Citește contul de serviciu Firebase din `FIREBASE_SERVICE_ACCOUNT`.
 * `JSON.parse` transformă `\n` din `private_key` în newline-uri reale —
 * nu reconstruim PEM-ul rând cu rând.
 */

export type FirebaseServiceAccountJson = {
  project_id?: string
  client_email?: string
  private_key?: string
  projectId?: string
  clientEmail?: string
  privateKey?: string
  [key: string]: unknown
}

function hasServiceAccountFields(value: Record<string, unknown>): boolean {
  const projectId = value.project_id ?? value.projectId
  const clientEmail = value.client_email ?? value.clientEmail
  const privateKey = value.private_key ?? value.privateKey
  return (
    typeof projectId === "string" &&
    projectId.trim().length > 0 &&
    typeof clientEmail === "string" &&
    clientEmail.trim().length > 0 &&
    typeof privateKey === "string" &&
    privateKey.includes("BEGIN")
  )
}

function asServiceAccount(value: unknown): FirebaseServiceAccountJson | null {
  if (typeof value === "string") {
    try {
      return asServiceAccount(JSON.parse(value))
    } catch {
      return null
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }
  const obj = value as Record<string, unknown>
  return hasServiceAccountFields(obj) ? obj : null
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    const quoted =
      (raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))
    if (quoted && raw.length > 1) {
      return JSON.parse(raw.slice(1, -1))
    }
    throw new SyntaxError("FIREBASE_SERVICE_ACCOUNT nu e JSON valid.")
  }
}

/** `JSON.parse` pe JSON-ul complet din `FIREBASE_SERVICE_ACCOUNT`. */
export function parseFirebaseServiceAccountJson(
  raw: string | undefined | null,
): FirebaseServiceAccountJson | null {
  if (typeof raw !== "string") {
    return null
  }
  const trimmed = raw.trim()
  if (!trimmed) {
    return null
  }
  try {
    return asServiceAccount(parseJson(trimmed))
  } catch {
    return null
  }
}
