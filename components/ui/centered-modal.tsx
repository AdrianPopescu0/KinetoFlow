"use client"

import { useEffect, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Modal pe viewport (portal pe body):
 * fixed inset-0 + flex items-center justify-center + backdrop întunecat.
 * Header/footer fixe; zona de conținut are scroll intern.
 */
export function CenteredModal({
  title,
  titleId,
  headerExtra,
  onClose,
  children,
  footer,
  className,
  wide,
}: {
  title: ReactNode
  titleId: string
  headerExtra?: ReactNode
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
  wide?: boolean
}) {
  const [mounted, setMounted] = useState(() => typeof window !== "undefined")

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      return
    }
    const body = document.body
    const html = document.documentElement
    const previousBodyOverflow = body.style.overflow
    const previousHtmlOverflow = html.style.overflow
    body.style.overflow = "hidden"
    html.style.overflow = "hidden"
    return () => {
      body.style.overflow = previousBodyOverflow
      html.style.overflow = previousHtmlOverflow
    }
  }, [mounted])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [onClose])

  if (!mounted) {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Închide" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => event.stopPropagation()}
        className={cn(
          "relative z-10 flex w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl",
          "dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)] dark:text-[var(--kf-text)]",
          "h-auto max-h-[calc(100dvh-2rem)]",
          wide ? "max-w-2xl" : "max-w-xl",
          className,
        )}
      >
        <header className="flex shrink-0 flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4 dark:border-[var(--kf-border)]">
          <div className="flex items-start justify-between gap-3">
            <h2
              id={titleId}
              className="min-w-0 pt-0.5 text-base font-semibold text-slate-900 sm:text-lg dark:text-slate-100"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Închide"
            >
              <X className="size-4" />
            </button>
          </div>
          {headerExtra ? <div className="min-w-0">{headerExtra}</div> : null}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5 sm:py-4">
          {children}
        </div>

        {footer ? (
          <footer className="shrink-0 border-t border-slate-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 sm:pb-4 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)]">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
