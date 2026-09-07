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

/** iOS Safari nu emite beforeinstallprompt — fără eveniment, butonul rămâne ascuns. */
export function shouldShowInstallButton(options: {
  promptEvent: BeforeInstallPromptEvent | null
  isStandalone: boolean
}): boolean {
  return options.promptEvent != null && !options.isStandalone
}
