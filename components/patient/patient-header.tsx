import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

type PatientHeaderProps = {
  firstName: string
  dateLabel: string
  progressPercent: number
  programLabel: string
}

export function PatientHeader({
  firstName,
  dateLabel,
  progressPercent,
  programLabel,
}: PatientHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#022c22]/75 text-white backdrop-blur-md">
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-teal-300" />
            <span className="text-sm font-semibold tracking-[0.16em] text-teal-100/80 uppercase">
              KinetoFlow
            </span>
          </div>
          <p className="max-w-[50%] text-right text-xs leading-snug text-emerald-100/70">
            {dateLabel}
          </p>
        </div>

        <div>
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-white">
            Salut, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-emerald-100/70">{programLabel}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium text-slate-300">
            <span>Programul tău de recuperare activ</span>
            <span className="tabular-nums text-teal-300">{progressPercent}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresul programului de recuperare"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
