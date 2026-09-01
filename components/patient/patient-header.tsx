import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"

type PatientHeaderProps = {
  firstName: string
  dateLabel: string
}

export function PatientHeader({ firstName, dateLabel }: PatientHeaderProps) {
  return (
    <header className="sticky top-0 z-20 bg-[#042f2e] text-white">
      <div className="mx-auto flex max-w-lg flex-col gap-3 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-white" />
            <span className="text-sm font-semibold tracking-[0.16em] uppercase">KinetoFlow</span>
          </div>
          <p className="text-right text-xs text-teal-50/80">{dateLabel}</p>
        </div>
        <div>
          <h1 className="text-[1.55rem] leading-tight font-semibold tracking-tight">
            Bună, {firstName}!
          </h1>
          <p className="mt-1 text-sm text-teal-50/85">
            Iată planul tău de recuperare pentru azi.
          </p>
        </div>
      </div>
    </header>
  )
}
