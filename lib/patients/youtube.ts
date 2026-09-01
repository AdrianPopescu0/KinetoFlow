/** Client-safe YouTube URL helpers. Do not import server modules from here. */

export function youtubeIdFromUrl(url: string | null): string | null {
  if (!url) {
    return null
  }

  const trimmed = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace(/^\//, "").split("/")[0]
      return id || null
    }
    const fromQuery = parsed.searchParams.get("v")
    if (fromQuery) {
      return fromQuery
    }
    const parts = parsed.pathname.split("/").filter(Boolean)
    const embedIndex = parts.indexOf("embed")
    if (embedIndex >= 0 && parts[embedIndex + 1]) {
      return parts[embedIndex + 1]
    }
    return parts.at(-1) ?? null
  } catch {
    return null
  }
}
