import { Check } from "lucide-react"

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
    <section className="flex flex-col items-center rounded-2xl border border-emerald-200 bg-white px-5 py-8 text-center shadow-sm">
      <div className="flex items-center gap-2" aria-hidden="true">
        <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
          <Check className="size-8 stroke-[3]" />
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400 text-white">
          <Check className="size-5 stroke-[3]" />
        </span>
        <span className="flex size-10 items-center justify-center rounded-full bg-emerald-400 text-white">
          <Check className="size-5 stroke-[3]" />
        </span>
      </div>

      <h2 className="mt-6 max-w-sm text-xl font-semibold tracking-tight text-[#0F4C5C] text-balance">
        Check-in-ul a fost trimis terapeutului tău! Ne vedem mâine 👍
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {alreadySubmitted
          ? "Ai trimis deja evaluarea pentru ziua de azi. Poți reveni mâine cu un check-in nou."
          : "Mulțumim. Răspunsul tău ajută terapeutul să ajusteze programul."}
      </p>

      <dl className="mt-6 w-full divide-y divide-slate-100 overflow-hidden rounded-xl bg-slate-50 text-left text-sm">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-slate-500">Durere</dt>
          <dd className="font-semibold text-[#0F4C5C]">
            {checkin.pain}/10 · {intensity.label}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-slate-500">Somn</dt>
          <dd className="font-semibold text-[#0F4C5C]">
            {sleep ? `${sleep.emoji} ${sleep.label}` : "—"}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-slate-500">Tip durere</dt>
          <dd className="font-semibold text-[#0F4C5C]">{painKind?.label ?? "—"}</dd>
        </div>
        {checkin.notes ? (
          <div className="flex flex-col gap-1 px-4 py-3">
            <dt className="text-slate-500">Mențiuni</dt>
            <dd className="font-medium text-[#0F4C5C]">{checkin.notes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
