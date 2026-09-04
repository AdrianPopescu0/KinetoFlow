import { Check } from "lucide-react"

import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { sleepLabel } from "@/lib/patients/display"
import { energyLabel, painIntensityCopy } from "@/lib/patients/program"
import type { DailyCheckin } from "@/lib/patients/types"

export function CheckinSuccess({
  checkin,
  alreadySubmitted,
}: {
  checkin: DailyCheckin
  alreadySubmitted: boolean
}) {
  const intensity = painIntensityCopy(checkin.pain)

  return (
    <section className={surfaceCardClassName("flex h-full min-h-0 flex-col items-center px-5 py-8 text-center")}>
      <span className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white">
        <Check className="size-8 stroke-[3]" />
      </span>
      <h2 className="mt-6 max-w-sm text-xl font-semibold text-slate-800">
        Check-in-ul a fost trimis terapeutului tău! Ne vedem mâine 👍
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        {alreadySubmitted
          ? "Ai trimis deja evaluarea pentru ziua de azi."
          : "Mulțumim. Răspunsul ajută la ajustarea programului."}
      </p>
      <dl className="mt-auto w-full divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 text-left text-sm">
        <div className="flex justify-between px-4 py-3">
          <dt className="text-slate-500">Durere</dt>
          <dd className="font-semibold">
            {checkin.pain}/10 · {intensity.label}
          </dd>
        </div>
        <div className="flex justify-between px-4 py-3">
          <dt className="text-slate-500">Somn</dt>
          <dd className="font-semibold">{sleepLabel(checkin.sleep)}</dd>
        </div>
        {checkin.energy ? (
          <div className="flex justify-between px-4 py-3">
            <dt className="text-slate-500">Energie</dt>
            <dd className="font-semibold">{energyLabel(checkin.energy)}</dd>
          </div>
        ) : null}
        {checkin.notes ? (
          <div className="flex flex-col gap-1 px-4 py-3">
            <dt className="text-slate-500">Notițe</dt>
            <dd className="font-medium">{checkin.notes}</dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
