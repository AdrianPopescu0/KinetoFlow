export type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[]
  prompt: () => Promise<void>
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed"
    platform: string
  }>
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent
  }
}

export function isStandaloneDisplay(win: {
  matchMedia?: (query: string) => { matches: boolean }
  navigator?: unknown
}): boolean {
  if (win.matchMedia?.("(display-mode: standalone)").matches) {
    return true
  }
  if (win.matchMedia?.("(display-mode: fullscreen)").matches) {
    return true
  }
  if (win.matchMedia?.("(display-mode: minimal-ui)").matches) {
    return true
  }
  const navigator = win.navigator
  return Boolean(
    navigator &&
      typeof navigator === "object" &&
      "standalone" in navigator &&
      Boolean((navigator as { standalone?: boolean }).standalone),
  )
}

/** Butonul rămâne vizibil în browser; dispare doar dacă PWA-ul e deja deschis. */
export function shouldShowInstallButton(options: { isStandalone: boolean }): boolean {
  return !options.isStandalone
}
