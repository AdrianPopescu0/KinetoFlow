"use client"

import { useState, type ReactNode } from "react"
import { BookOpen, ChevronDown, X } from "lucide-react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { EXTRA_HEALTH_TIPS, RECOVERY_ARTICLES } from "@/lib/patients/recovery-guide"
import { cn } from "@/lib/utils"

export function RecoveryGuidePanel({ onReadMore }: { onReadMore: () => void }) {
  const [openId, setOpenId] = useState<string | null>(RECOVERY_ARTICLES[0]?.id ?? null)

  return (
    <section className={surfaceCardClassName("p-4")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Hub educațional</p>
      <h2 className="mt-1 text-lg font-semibold text-slate-900">Ghidul tău de recuperare</h2>
      <p className="mt-1 text-sm text-slate-600">Răspunsuri scurte pentru zilele dintre ședințe.</p>

      <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
        {RECOVERY_ARTICLES.map((article) => {
          const open = openId === article.id
          return (
            <div key={article.id}>
              <button
                type="button"
                onClick={() => setOpenId(open ? null : article.id)}
                className="flex w-full items-start justify-between gap-3 px-3 py-3 text-left"
                aria-expanded={open}
              >
                <span>
                  <span className="block text-sm font-semibold text-slate-900">{article.title}</span>
                  {!open ? <span className="mt-1 block text-xs text-slate-500">{article.summary}</span> : null}
                </span>
                <ChevronDown className={cn("mt-0.5 size-4 shrink-0 text-slate-400 transition", open && "rotate-180")} />
              </button>
              {open ? (
                <div className="space-y-2 px-3 pb-3 text-sm leading-relaxed text-slate-600">
                  {article.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <Button type="button" variant="outline" onClick={onReadMore} className="mt-4 h-11 w-full rounded-xl">
        <BookOpen className="size-4" />
        Citește mai multe sfaturi de sănătate
      </Button>
    </section>
  )
}

export function ExtraTipsDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Închide" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="extra-tips-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id="extra-tips-title" className="text-lg font-semibold text-slate-900">
            Mai multe sfaturi de sănătate
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Închide">
            <X className="size-5" />
          </button>
        </div>
        <ul className="mt-4 flex flex-col gap-4">
          {EXTRA_HEALTH_TIPS.map((tip) => (
            <li key={tip.title} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{tip.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{tip.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export function RecoveryDrawer({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Închide ghidul" onClick={onClose} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="recovery-drawer-title"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-slate-50 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <h2 id="recovery-drawer-title" className="text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Închide">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">{children}</div>
      </aside>
    </div>
  )
}
