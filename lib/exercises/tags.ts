/** Parse one or many tag ids stored as text, JSON, Postgres arrays, or JS arrays. */
export function parseTagList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueTags(value.map((item) => String(item)))
  }
  if (typeof value !== "string") {
    return []
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return []
  }

  if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
    try {
      const parsed = JSON.parse(trimmed.startsWith("{") ? `[${trimmed.slice(1, -1)}]` : trimmed) as unknown
      if (Array.isArray(parsed)) {
        return uniqueTags(parsed.map((item) => String(item)))
      }
    } catch {
      const inner = trimmed.slice(1, -1)
      return uniqueTags(inner.split(","))
    }
  }

  return uniqueTags(trimmed.split(/[,;|]/))
}

export function serializeTagList(values: string[]): string {
  return uniqueTags(values).join(",")
}

export function uniqueTags(values: Array<string | null | undefined>): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const tag = value?.trim()
    if (!tag || seen.has(tag)) {
      continue
    }
    seen.add(tag)
    result.push(tag)
  }
  return result
}
