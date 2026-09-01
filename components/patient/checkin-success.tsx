import { Check } from "lucide-react"

import { glassCardClassName } from "@/components/brand/app-atmosphere"
import { PAIN_KIND_OPTIONS, SLEEP_OPTIONS, painIntensityCopy } from "@/lib/patients/program"
import type { DailyCheckin } from "@/lib/patients/types"

type CheckinSuccessProps = {
  checkin: DailyCheckin
  alreadySubmitted: boolean
}

export function CheckinSuccess({ checkin, alreadySubmitted }: CheckinSuccessProps) {
  const sleep = SLEEP_OPTIONS.find((option) => option.value === checkin.sleep)
  const painKind = PAIN_KIND_OPTIONS.find((option) => option.value === checkin.painKind)
  const intensity = painIntensityCopy(checkin.pain)

  return (
    <section className={glassCardClassName("flex flex-col items-center px-5 py-8 text-center")}>
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-emerald-950 shadow-[0_10px_30px_-8px_rgba(16,185,129,0.7)]">
          <Check className="size-8 stroke-[3]" />
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-teal-400 text-emerald-950">
          <Check className="size-5 stroke-[3]" />
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-teal-400 text-emerald-950">
          <Check className="size-5 stroke-[3]" />
        </span>
      </div>

      <h2 className="mt-6 max-w-sm text-xl font-semibold tracking-tight text-balance text-white">
        Check-in-ul a fost trimis terapeutului tău! Ne vedem mâine 👍
      </h2>
      <p className="mt-2 max-w-sm text-sm text-emerald-100/70">
        {alreadySubmitted
          ? "Ai trimis deja evaluarea pentru ziua de azi. Poți reveni mâine cu un check-in nou."
          : "Mulțumim. Răspunsul tău ajută terapeutul să ajusteze programul."}
      </p>

      <dl className="mt-6 w-full divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 text-left text-sm backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-slate-300">Durere</dt>
          <dd className="font-semibold text-white">
            {checkin.pain}/10 · {intensity.label}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-slate-300">Somn</dt>
          <dd className="font-semibold text-white">
            {sleep ? `${sleep.emoji} ${sleep.label}` : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-slate-300">Tip durere</dt>
          <dd className="font-semibold text-white">{painKind?.label ?? "—"}</dd>
        </div>
        {checkin.notes ? (
          <div className="flex flex-col gap-1 px-4 py-3">
            <dt className="text-slate-300">Mențiuni</dt>
            <dd className="font-medium text-white">{checkin.notes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
