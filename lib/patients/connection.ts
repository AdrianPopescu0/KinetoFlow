export function isBrowserOnline(): boolean {
  if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") {
    return true
  }
  return navigator.onLine
}

export function isLikelyOfflineError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true
  }
  if (error instanceof TypeError) {
    return true
  }
  if (error instanceof DOMException && error.name === "NetworkError") {
    return true
  }
  const message = error instanceof Error ? error.message : String(error ?? "")
  return /failed to fetch|networkerror|load failed|network request failed|err_internet_disconnected/i.test(
    message,
  )
}

export function subscribeOnlineStatus(onChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => undefined
  }
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}
