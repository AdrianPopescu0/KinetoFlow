"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Download, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog"
import {
  isStandaloneDisplay,
  shouldShowInstallButton,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa/before-install-prompt"
import { extraBrowserGuides, installGuideFor, navigatorHintsFrom, type InstallGuide } from "@/lib/pwa/install-guide"
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
  const [guideOpen, setGuideOpen] = useState(false)
  const [guide, setGuide] = useState<InstallGuide | null>(null)

  useEffect(() => {
    setIsStandalone(isStandaloneDisplay(window))
    setGuide(installGuideFor(navigatorHintsFrom(navigator)))

    if (window.__pwaInstallPrompt) {
      setPromptEvent(window.__pwaInstallPrompt)
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault()
      const next = event as BeforeInstallPromptEvent
      window.__pwaInstallPrompt = next
      setPromptEvent(next)
    }

    function onAppInstalled() {
      window.__pwaInstallPrompt = undefined
      setPromptEvent(null)
      setIsStandalone(true)
      setGuideOpen(false)
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt)
    window.addEventListener("appinstalled", onAppInstalled)
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt)
      window.removeEventListener("appinstalled", onAppInstalled)
    }
  }, [])

  const extras = useMemo(
    () => (guide ? extraBrowserGuides(guide.browser, guide.platform) : []),
    [guide],
  )

  const openManualGuide = useCallback(() => {
    setGuide((current) => current ?? installGuideFor(navigatorHintsFrom(navigator)))
    setGuideOpen(true)
  }, [])

  const handleInstall = useCallback(async () => {
    if (promptEvent) {
      setBusy(true)
      try {
        await promptEvent.prompt()
        await promptEvent.userChoice
        return
      } catch (error) {
        console.warn("[InstallPWAButton] Prompt-ul nativ a eșuat, afișez pașii manuali.", error)
        openManualGuide()
      } finally {
        window.__pwaInstallPrompt = undefined
        setPromptEvent(null)
        setBusy(false)
      }
      return
    }

    openManualGuide()
  }, [openManualGuide, promptEvent])

  if (!shouldShowInstallButton({ isStandalone })) {
    return null
  }

  return (
    <>
      <Button
        type="button"
        variant={variant === "onDark" ? "secondary" : "default"}
        disabled={busy}
        aria-busy={busy}
        aria-haspopup="dialog"
        onClick={() => {
          void handleInstall()
        }}
        className={cn(
          "h-auto min-h-11 w-full gap-2 whitespace-normal px-3 py-2.5 text-center leading-snug sm:w-auto",
          "[@media(display-mode:standalone)]:hidden",
          variant === "onDark" &&
            "bg-white text-[#042f2e] hover:bg-teal-50 aria-expanded:bg-white aria-expanded:text-[#042f2e]",
          className,
        )}
      >
        <Download className="size-4 shrink-0" />
        {busy ? "Se deschide instalarea…" : "Instalează Aplicația KinetoFlow"}
      </Button>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogPopup className="max-h-[min(90vh,40rem)] overflow-y-auto">
          <DialogClose
            className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Închide"
          >
            <X className="size-4" />
          </DialogClose>

          <DialogTitle>Instalează KinetoFlow</DialogTitle>
          <DialogDescription className="mt-1.5">
            {guide?.intro ??
              "Adaugă KinetoFlow pe ecranul de start ca să deschizi programul dintr-o iconiță, fără bara de adrese."}
          </DialogDescription>

          {guide ? (
            <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50/70 p-4">
              <p className="text-sm font-semibold text-[#042f2e]">{guide.title}</p>
              <ol className="mt-2 list-decimal space-y-2 pl-4 text-sm leading-relaxed text-slate-700">
                {guide.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          ) : null}

          {extras.length > 0 ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {guide?.platform === "desktop"
                  ? "Chrome și Brave"
                  : "Chrome, Brave și Samsung Internet"}
              </p>
              {extras.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <ol className="mt-1.5 list-decimal space-y-1.5 pl-4 text-sm leading-relaxed text-slate-600">
                    {item.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          ) : null}

          <Button type="button" className="mt-5 h-11 w-full rounded-xl" onClick={() => setGuideOpen(false)}>
            Am înțeles
          </Button>
        </DialogPopup>
      </Dialog>
    </>
  )
}
