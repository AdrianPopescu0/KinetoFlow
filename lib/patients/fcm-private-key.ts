/** Normalizează PEM-ul din Vercel / .env, unde `\n` rămâne adesea literal. */

function stripWrappingQuotes(value: string): string {
  let next = value.replace(/^\uFEFF/, "").trim()
  for (let i = 0; i < 3; i += 1) {
    if (next.length < 2) {
      break
    }
    const quote = next[0]
    if ((quote === '"' || quote === "'") && next.endsWith(quote)) {
      next = next.slice(1, -1).trim()
      continue
    }
    break
  }
  return next
}

/**
 * Transformă `FIREBASE_PRIVATE_KEY` (sau `private_key` din JSON) într-un PEM
 * cu newline-uri reale. Un singur `.replace(/\\n/g, "\n")` nu ajunge când
 * Vercel dublează escape-ul sau păstrează ghilimelele din `.env`.
 */
export function normalizeFirebasePrivateKey(raw: string | undefined | null): string | null {
  if (!raw) {
    return null
  }

  let key = stripWrappingQuotes(raw)
  if (!key) {
    return null
  }

  for (let i = 0; i < 4; i += 1) {
    const next = key
      .replace(/\\r\\n/g, "\n")
      .replace(/\\\\n/g, "\n")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
    if (next === key) {
      break
    }
    key = next
  }

  key = key.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim()
  key = key.replace(/(-----BEGIN [A-Z ]*PRIVATE KEY-----)\s*/g, "$1\n")
  key = key.replace(/\s*(-----END [A-Z ]*PRIVATE KEY-----)/g, "\n$1")
  key = key.replace(/\n{3,}/g, "\n\n").trim()

  if (!/-----BEGIN [A-Z ]*PRIVATE KEY-----/.test(key) || !/-----END [A-Z ]*PRIVATE KEY-----/.test(key)) {
    return null
  }

  return key.endsWith("\n") ? key : `${key}\n`
}
