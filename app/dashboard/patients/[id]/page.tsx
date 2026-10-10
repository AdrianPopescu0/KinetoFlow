import { Suspense } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { saveClinicalNotes } from "@/app/dashboard/patients/actions"
import { ClinicalNotesEditor } from "@/app/dashboard/patients/clinical-notes-editor"
import { NotifyChannelActions } from "@/app/dashboard/patients/notify-channel-actions"
import { PatientFileActions } from "@/app/dashboard/patients/patient-file-actions"
import { PatientFileHeader } from "@/app/dashboard/patients/patient-file-header"
import { PatientFileStampProvider } from "@/app/dashboard/patients/patient-file-stamp"
import {
  PatientExercisesSection,
  PatientExercisesSkeleton,
  PatientMonitoringSection,
  PatientMonitoringSkeleton,
} from "@/app/dashboard/patients/[id]/patient-file-sections"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { getCachedUser } from "@/lib/auth/session"
import {
  ARCHIVE_LOCKED_MESSAGE,
  fetchClinicSubscription,
  isClinicSubscriptionActive,
} from "@/lib/clinics/subscription"
import { getTherapistPatientHeader } from "@/lib/patients/queries"

type PatientFilePageProps = {
  params: Promise<{ id: string }>
}

export default async function PatientFilePage({ params }: PatientFilePageProps) {
  const { id } = await params
  const { patient, error, summary } = await getTherapistPatientHeader(id)
  if (!patient) {
    notFound()
  }

  const phone = patient.phone ?? ""
  const patientId = patient.id || id
  const archived = Boolean(patient.archived_at)
  let archiveLocked = false
  if (archived) {
    const { supabase, user } = await getCachedUser()
    if (user) {
      const subscription = await fetchClinicSubscription(supabase, user.id)
      archiveLocked = !isClinicSubscriptionActive(subscription.startsAt, subscription.endsAt)
    }
  }

  if (archiveLocked) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
        <Link href="/dashboard" prefetch className="inline-flex items-center gap-1 text-sm font-medium text-[#042f2e]">
          <ArrowLeft className="size-4" />
          Înapoi la dashboard
        </Link>
        <section className={surfaceCardClassName("p-5")}>
          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">Arhiva Clinicii</p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-800">Fișă arhivată</h1>
          <p className="mt-3 text-sm text-slate-600">{ARCHIVE_LOCKED_MESSAGE}</p>
        </section>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <Link
        href={archived ? "/dashboard/arhiva" : "/dashboard"}
        prefetch
        className="inline-flex items-center gap-1 text-sm font-medium text-[#042f2e] dark:text-teal-300"
      >
        <ArrowLeft className="size-4" />
        {archived ? "Înapoi la arhivă" : "Înapoi la dashboard"}
      </Link>

      {error ? <p className="text-sm text-red-700 dark:text-red-300">{error}</p> : null}

      <PatientFileStampProvider initialUpdatedAt={patient.updated_at}>
        <section className={surfaceCardClassName("p-5")}>
          <PatientFileHeader
            patient={patient}
            summary={summary}
            actions={<PatientFileActions patient={patient} />}
          />
          {phone ? (
            <div className="mt-5 max-w-md border-t border-slate-200 pt-4 dark:border-[var(--kf-border)]">
              <NotifyChannelActions
                patientId={patient.id}
                phone={phone}
                initialChannel={patient.notify_channel}
              />
            </div>
          ) : null}
        </section>

        <section className={surfaceCardClassName("p-5")}>
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100">Notițe clinice</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Notițele sunt salvate și vizibile pentru toți terapeuții din clinică.
          </p>
          <div className="mt-4">
            <ClinicalNotesEditor
              patientId={patientId}
              patient_id={patientId}
              saveAction={saveClinicalNotes.bind(null, patientId)}
              serverNotes={patient.clinical_notes}
            />
          </div>
        </section>
      </PatientFileStampProvider>

      <Suspense fallback={<PatientMonitoringSkeleton />}>
        <PatientMonitoringSection patientId={id} />
      </Suspense>

      <Suspense fallback={<PatientExercisesSkeleton />}>
        <PatientExercisesSection patientId={patient.id} patientName={patient.full_name} />
      </Suspense>
    </main>
  )
}
