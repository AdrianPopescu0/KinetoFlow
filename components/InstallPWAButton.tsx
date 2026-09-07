"use client"

import { useCallback, useEffect, useState } from "react"
import { Download } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  isStandaloneDisplay,
  shouldShowInstallButton,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/before-install-prompt"
import { cn } from "@/lib/utils"

type InstallPWAButtonProps = {
  className?: string
  /** `onDark` — contrast pe header-ul teal al pacientului. */
  variant?: "default" | "onDark"
}

export function InstallPWAButton({ className, variant = "default" }: InstallPWAButtonProps) {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay(window))

    if (window.__pwaInstallPrompt) {
      setPromptEvent(window.__pwaInstallPrompt)
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      const promptEvent = event as BeforeInstallPromptEvent
      window.__pwaInstallPrompt = promptEvent
      setPromptEvent(promptEvent)
    }

    function onAppInstalled() {
      window.__pwaInstallPrompt = undefined
      setPromptEvent(null)
      setIsStandalone(true)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const handleInstall = useCallback(async () => {
    if (!promptEvent) {
      return
    }

    setBusy(true)
    try {
      await promptEvent.prompt()
      await promptEvent.userChoice
    } catch (error) {
      console.warn("[InstallPWAButton] Prompt-ul de instalare a eșuat.", error)
    } finally {
      // Evenimentul e consumat după prompt(), indiferent de accept / dismiss.
      window.__pwaInstallPrompt = undefined
      setPromptEvent(null)
      setBusy(false)
    }
  }, [promptEvent])

  if (!shouldShowInstallButton({ promptEvent, isStandalone })) {
    return null
  }

  return (
    <Button
      type="button"
      variant={variant === "onDark" ? "secondary" : "default"}
      disabled={busy}
      aria-busy={busy}
      onClick={() => {
        void handleInstall()
      }}
      className={cn(
        "h-auto min-h-11 w-full gap-2 whitespace-normal px-3 py-2.5 text-center leading-snug sm:w-auto",
        variant === "onDark" &&
          "bg-white text-[#042f2e] hover:bg-teal-50 aria-expanded:bg-white aria-expanded:text-[#042f2e]",
        className,
      )}
    >
      <Download className="size-4 shrink-0" />
      {busy ? "Se deschide instalarea…" : "Instalează Aplicația KinetoFlow"}
    </Button>
  )
}
