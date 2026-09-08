/**
 * Normalizează PEM-ul Firebase din Vercel / .env.
 * Valorile vin adesea cu `\n` literale, ghilimele, JSON dublu-escapat sau
 * tot PEM-ul pe un singur rând — OpenSSL cere un PEM canonic.
 */

const PEM_LABEL = "BEGIN ([A-Z ]*PRIVATE KEY)"
const PEM_BLOCK =
  /-----BEGIN ([A-Z ]*PRIVATE KEY)-----([\s\S]*?)-----END \1-----/
const BASE64_CHARS = /[^A-Za-z0-9+/=]/g
const INVISIBLE = /[\u200B-\u200D\uFEFF\u00A0]/g

export type FirebaseServiceAccountFields = {
  projectId: string
  clientEmail: string
  privateKey: string
}

function stripInvisible(value: string): string {
  return value.replace(INVISIBLE, " ").replace(/^\uFEFF/, "")
}

function stripOneWrappingQuoteLayer(value: string): string {
  const next = stripInvisible(value).trim()
  if (next.length < 2) {
    return next
  }
  const start = next[0]
  const end = next[next.length - 1]
  const paired =
    (start === '"' && end === '"') ||
    (start === "'" && end === "'") ||
    (start === "`" && end === "`") ||
    (start === "\u201c" && end === "\u201d") ||
    (start === "\u2018" && end === "\u2019")
  if (!paired) {
    return next
  }
  return stripInvisible(next.slice(1, -1)).trim()
}

function stripWrappingQuotes(value: string): string {
  let next = stripInvisible(value).trim()
  for (let i = 0; i < 4; i += 1) {
    const unquoted = stripOneWrappingQuoteLayer(next)
    if (unquoted === next) {
      break
    }
    next = unquoted
  }
  return next
}

function tryParseJsonString(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed.startsWith('"') || !trimmed.endsWith('"')) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return typeof parsed === "string" ? parsed : null
  } catch {
    return null
  }
}

/** Reduce `\\\\n` → `\\n` → newline real, plus `\r` și escape-uri Unicode. */
function unescapeEnvNewlines(value: string): string {
  let key = value
  for (let i = 0; i < 8; i += 1) {
    const reduced = key.replace(/\\\\n/g, "\\n").replace(/\\\\r/g, "\\r")
    if (reduced === key) {
      break
    }
    key = reduced
  }
  return key
    .replace(/\\u000d\\u000a/gi, "\n")
    .replace(/\\u000a/gi, "\n")
    .replace(/\\u000d/gi, "\n")
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
}

function wrapBase64(body: string): string {
  const compact = body.replace(BASE64_CHARS, "")
  const lines: string[] = []
  for (let i = 0; i < compact.length; i += 64) {
    lines.push(compact.slice(i, i + 64))
  }
  return lines.join("\n")
}

function rebuildPem(raw: string): string | null {
  const match = raw.match(PEM_BLOCK)
  if (!match) {
    return null
  }
  const label = match[1].replace(/\s+/g, " ").trim()
  if (!label) {
    return null
  }
  const body = wrapBase64(
    match[2].replace(/\\n/g, "").replace(/\\r/g, "").replace(/["'`]/g, ""),
  )
  if (body.length < 16) {
    return null
  }
  return `-----BEGIN ${label}-----\n${body}\n-----END ${label}-----\n`
}

function decodeBase64Pem(raw: string): string | null {
  const compact = raw.replace(/\s+/g, "")
  if (compact.length < 32 || /[^A-Za-z0-9+/=]/.test(compact)) {
    return null
  }
  try {
    const decoded = Buffer.from(compact, "base64").toString("utf8")
    if (new RegExp(`-----${PEM_LABEL}-----`).test(decoded)) {
      return decoded
    }
  } catch {
    return null
  }
  return null
}

function extractPemCandidate(raw: string): string {
  const begin = raw.search(/-----BEGIN [A-Z ]*PRIVATE KEY-----/)
  const endMatch = raw.match(/-----END [A-Z ]*PRIVATE KEY-----/)
  if (begin < 0 || !endMatch || endMatch.index === undefined) {
    return raw
  }
  const end = endMatch.index + endMatch[0].length
  if (end <= begin) {
    return raw
  }
  return raw.slice(begin, end)
}

function normalizeOnce(raw: string, depth: number): string | null {
  if (depth > 4) {
    return null
  }

  let key = stripWrappingQuotes(raw)
  if (!key) {
    return null
  }

  const fromJsonString = tryParseJsonString(key)
  if (fromJsonString) {
    return normalizeOnce(fromJsonString, depth + 1)
  }

  if (key.startsWith("{") && /private_key|privateKey/.test(key)) {
    const fromJson = parseFirebaseServiceAccountJson(key)
    if (fromJson) {
      return fromJson.privateKey
    }
    const onlyKey = captureJsonString(key, "private_key", "privateKey")
    if (onlyKey) {
      return normalizeOnce(onlyKey, depth + 1)
    }
  }

  key = unescapeEnvNewlines(key)
  key = stripWrappingQuotes(key)

  const rebuilt = rebuildPem(extractPemCandidate(key))
  if (rebuilt) {
    return rebuilt
  }

  const decoded = decodeBase64Pem(key)
  if (decoded) {
    return normalizeOnce(decoded, depth + 1)
  }

  return null
}

/**
 * Transformă `FIREBASE_PRIVATE_KEY` (sau `private_key` din JSON) într-un PEM
 * PKCS#8/PKCS#1 cu newline-uri reale și body Base64 pe linii de 64.
 */
export function normalizeFirebasePrivateKey(raw: string | undefined | null): string | null {
  if (!raw) {
    return null
  }
  return normalizeOnce(raw, 0)
}

function jsonCandidates(raw: string): string[] {
  const unique = new Set<string>()
  const push = (value: string) => {
    const next = stripInvisible(value).trim()
    if (next) {
      unique.add(next)
    }
  }

  let current = stripInvisible(raw).trim()
  push(current)

  for (let i = 0; i < 4; i += 1) {
    const parsedString = tryParseJsonString(current)
    if (parsedString) {
      push(parsedString)
      current = stripInvisible(parsedString).trim()
      continue
    }
    const unquoted = stripOneWrappingQuoteLayer(current)
    if (unquoted === current) {
      break
    }
    push(unquoted)
    current = unquoted
  }

  return [...unique]
}

function fieldsFromUnknown(value: unknown): FirebaseServiceAccountFields | null {
  if (!value || typeof value !== "object") {
    return null
  }
  const parsed = value as {
    project_id?: unknown
    projectId?: unknown
    client_email?: unknown
    clientEmail?: unknown
    private_key?: unknown
    privateKey?: unknown
  }
  const projectId = stringField(parsed.project_id ?? parsed.projectId)
  const clientEmail = stringField(parsed.client_email ?? parsed.clientEmail)
  const privateKey = normalizeFirebasePrivateKey(stringField(parsed.private_key ?? parsed.privateKey))
  if (!projectId || !clientEmail || !privateKey) {
    return null
  }
  return { projectId, clientEmail, privateKey }
}

function stringField(value: unknown): string | null {
  if (typeof value !== "string") {
    return null
  }
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function captureJsonString(raw: string, snake: string, camel: string): string | null {
  const names = `${snake}|${camel}`
  const escaped = raw.match(new RegExp(`"(?:${names})"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`))
  if (escaped?.[1]) {
    try {
      return JSON.parse(`"${escaped[1]}"`) as string
    } catch {
      return unescapeEnvNewlines(escaped[1])
    }
  }
  const multiline = raw.match(new RegExp(`"(?:${names})"\\s*:\\s*"([\\s\\S]*?)"\\s*(?:,|\\})`))
  return multiline?.[1] ? multiline[1] : null
}

function fieldsFromRegex(raw: string): FirebaseServiceAccountFields | null {
  const projectId = captureJsonString(raw, "project_id", "projectId")?.trim()
  const clientEmail = captureJsonString(raw, "client_email", "clientEmail")?.trim()
  const privateKey = normalizeFirebasePrivateKey(captureJsonString(raw, "private_key", "privateKey"))
  if (!projectId || !clientEmail || !privateKey) {
    return null
  }
  return { projectId, clientEmail, privateKey }
}

/** Citește `FIREBASE_SERVICE_ACCOUNT` chiar dacă e JSON dublu-escapat sau cu ghilimele extra. */
export function parseFirebaseServiceAccountJson(
  raw: string | undefined | null,
): FirebaseServiceAccountFields | null {
  if (!raw) {
    return null
  }

  for (const candidate of jsonCandidates(raw)) {
    try {
      const parsed: unknown = JSON.parse(candidate)
      if (typeof parsed === "string") {
        const nested = parseFirebaseServiceAccountJson(parsed)
        if (nested) {
          return nested
        }
        continue
      }
      const fields = fieldsFromUnknown(parsed)
      if (fields) {
        return fields
      }
    } catch {
      const fields = fieldsFromRegex(candidate)
      if (fields) {
        return fields
      }
    }
  }

  return fieldsFromRegex(stripWrappingQuotes(raw))
}
