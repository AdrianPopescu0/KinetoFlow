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
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0F4C5C] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-white">
            <KinetoFlowMark className="size-8 text-[#7CDBD0]" />
            <span className="text-sm font-semibold tracking-wide">KinetoFlow</span>
          </div>
          <p className="max-w-[50%] text-right text-xs leading-snug text-white/75">
            {dateLabel}
          </p>
        </div>

        <div>
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">
            Salut, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-white/75">{programLabel}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium">
            <span>Programul tău de recuperare activ</span>
            <span className="tabular-nums">{progressPercent}%</span>
          </div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/20"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progresul programului de recuperare"
          >
            <div
              className="h-full rounded-full bg-[#7CDBD0] transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
