import { ExerciseManager } from "@/app/dashboard/patients/exercise-manager"
import { VasChart } from "@/app/dashboard/patients/vas-chart"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { painKindLabel, sleepLabel } from "@/lib/patients/display"
import {
  getTherapistPatientCheckIns,
  getTherapistPatientExercises,
} from "@/lib/patients/queries"
import { formatExerciseDuration } from "@/lib/patients/session-duration"

export function PatientMonitoringSkeleton() {
  return (
    <section className={surfaceCardClassName("overflow-hidden")} aria-busy="true">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-80 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="h-56 animate-pulse bg-slate-100" />
      <div className="space-y-3 border-t border-slate-200 p-5">
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
      </div>
    </section>
  )
}

export function PatientExercisesSkeleton() {
  return (
    <section className={surfaceCardClassName("overflow-hidden")} aria-busy="true">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="h-5 w-44 animate-pulse rounded bg-slate-200" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-slate-100" />
      </div>
      <div className="grid gap-3 p-5 sm:grid-cols-2">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </section>
  )
}

export async function PatientMonitoringSection({ patientId }: { patientId: string }) {
  const checkIns = await getTherapistPatientCheckIns(patientId)

  return (
    <section className={surfaceCardClassName("overflow-hidden")}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">Monitorizare clinică</h2>
        <p className="text-sm text-slate-600">
          Evoluția scorului VAS, istoricul check-in-urilor și durata ședinței de exerciții.
          Istoricul e același pentru toți terapeuții din cabinet — se încarcă după pacient, nu după terapeutul logat.
        </p>
      </div>
      <VasChart checkIns={checkIns} />
      <div className="overflow-x-auto border-t border-slate-200">
        {checkIns.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-600">Niciun check-in înregistrat.</p>
        ) : (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3">Data</th>
                <th className="px-5 py-3">Durere</th>
                <th className="px-5 py-3">Somn</th>
                <th className="px-5 py-3">Tip durere</th>
                <th className="px-5 py-3">Durată exerciții</th>
                <th className="px-5 py-3">Comentarii</th>
              </tr>
            </thead>
            <tbody>
              {checkIns.map((row) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-5 py-3 text-slate-700">
                    {new Date(row.created_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-800">{row.vas_score}/10</td>
                  <td className="px-5 py-3">{sleepLabel(row.sleep_quality)}</td>
                  <td className="px-5 py-3">{painKindLabel(row.pain_type)}</td>
                  <td className="px-5 py-3 font-medium tabular-nums text-slate-800">
                    {formatExerciseDuration(row.exercise_duration_seconds)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{row.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export async function PatientExercisesSection({
  patientId,
  patientName,
}: {
  patientId: string
  patientName: string
}) {
  const exercises = await getTherapistPatientExercises(patientId)

  return (
    <section className={surfaceCardClassName("overflow-hidden")}>
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-800">Exerciții prescrise</h2>
        <p className="text-sm text-slate-600">
          Planul pacientului, atribuit din biblioteca verificată de exerciții.
        </p>
      </div>
      <ExerciseManager patientId={patientId} patientName={patientName} exercises={exercises} />
    </section>
  )
}
