import { MessageCircle } from "lucide-react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { GOLDEN_RULES, whatsappHref } from "@/lib/patients/recovery-guide"
import { cn } from "@/lib/utils"

export function TherapistCard({
  therapistName,
  therapistPhone,
  className,
}: {
  therapistName: string
  therapistPhone: string | null
  className?: string
}) {
  return (
    <section className={cn(surfaceCardClassName("flex h-full min-h-0 flex-col p-5"), className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Kinetoterapeutul tău</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{therapistName}</p>
      <p className="mt-1 flex-1 text-sm leading-relaxed text-slate-600">
        Scrie dacă un exercițiu doare altfel decât de obicei sau dacă nu ești sigur de doză.
      </p>
      <a
        href={whatsappHref(therapistPhone)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-[#042f2e] px-3 text-sm font-semibold text-white hover:bg-[#064e3b]"
      >
        <MessageCircle className="size-4" />
        Scrie pe WhatsApp
      </a>
    </section>
  )
}

export function GoldenRulesCard({ className }: { className?: string }) {
  return (
    <section className={cn(surfaceCardClassName("flex h-full min-h-0 flex-col p-5"), className)}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Reguli de aur</p>
      <ol className="mt-3 flex flex-1 flex-col gap-3.5">
        {GOLDEN_RULES.map((rule, index) => (
          <li key={rule.title} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-[#042f2e]">
              {index + 1}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900">{rule.title}</span>
              <span className="mt-0.5 block text-sm leading-relaxed text-slate-600">{rule.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** Stack pentru drawer mobil / fallback. */
export function TherapistSupportColumn({
  therapistName,
  therapistPhone,
}: {
  therapistName: string
  therapistPhone: string | null
}) {
  return (
    <div className="flex flex-col gap-5">
      <TherapistCard therapistName={therapistName} therapistPhone={therapistPhone} />
      <GoldenRulesCard />
    </div>
  )
}
