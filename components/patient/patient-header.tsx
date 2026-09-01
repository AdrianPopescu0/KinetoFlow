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
    <header className="sticky top-0 z-20 bg-[#042f2e] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-white" />
            <span className="text-sm font-semibold tracking-[0.16em] uppercase">KinetoFlow</span>
          </div>
          <p className="max-w-[50%] text-right text-xs leading-snug text-teal-50/80">
            {dateLabel}
          </p>
        </div>

        <div>
          <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight">
            Salut, {firstName}! 👋
          </h1>
          <p className="mt-1 text-sm text-teal-50/80">{programLabel}</p>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-medium text-teal-50/85">
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
              className="h-full rounded-full bg-teal-300 transition-[width] duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
