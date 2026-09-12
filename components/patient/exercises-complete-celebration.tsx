import { PartyPopper } from "lucide-react"

import { EXERCISES_COMPLETE_MESSAGE } from "@/lib/patients/ux-copy"
import { cn } from "@/lib/utils"

export function ExercisesCompleteCelebration({ animate }: { animate: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "relative overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-5 sm:px-6",
        animate && "kf-celebrate-in",
      )}
    >
      <span className="kf-celebrate-spark kf-celebrate-spark-a" aria-hidden="true" />
      <span className="kf-celebrate-spark kf-celebrate-spark-b" aria-hidden="true" />
      <span className="kf-celebrate-spark kf-celebrate-spark-c" aria-hidden="true" />
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm",
            animate && "kf-celebrate-check",
          )}
        >
          <PartyPopper className="size-5" aria-hidden="true" />
        </span>
        <p className="pt-1.5 text-base font-semibold leading-snug text-emerald-950 sm:text-lg">
          {EXERCISES_COMPLETE_MESSAGE}
        </p>
      </div>
    </div>
  )
}
