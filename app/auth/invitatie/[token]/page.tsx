import type { Metadata } from "next"

import { AcceptTherapistInviteForm } from "@/app/auth/invitatie/accept-form"
import { LeaveUnavailableInviteButton } from "@/app/auth/invitatie/leave-unavailable-button"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Logo } from "@/components/Logo"
import { createServiceRoleClient } from "@/utils/supabase/admin"
import {
  isMissingTherapistInvitesTable,
  isTherapistInviteOpen,
  isTherapistInviteToken,
} from "@/lib/clinics/therapist-invite"
import { therapistInviteReasonMessage } from "@/lib/clinics/invite-attach"

export const metadata: Metadata = {
  title: "Invitație în clinică | KinetoFlow",
  description: "Creează-ți contul de terapeut cu Google sau cu emailul personal.",
}

type InvitePageProps = {
  params: Promise<{ token: string }>
  searchParams: Promise<{ reason?: string }>
}

export default async function TherapistInvitePage({ params, searchParams }: InvitePageProps) {
  const { token: rawToken } = await params
  const { reason } = await searchParams
  const token = decodeURIComponent(rawToken ?? "").trim()

  let status: "ok" | "invalid" | "expired" | "missing-table" = "invalid"
  let clinicName = ""
  let therapistName = ""

  if (isTherapistInviteToken(token)) {
    try {
      const admin = createServiceRoleClient()
      const { data, error } = await admin
        .from("therapist_invites")
        .select("clinic_name, therapist_name, expires_at, accepted_at")
        .eq("token", token)
        .maybeSingle()

      if (error && isMissingTherapistInvitesTable(error)) {
        status = "missing-table"
      } else if (data && isTherapistInviteOpen(data)) {
        status = "ok"
        clinicName = String(data.clinic_name ?? "").trim()
        therapistName = String(data.therapist_name ?? "").trim()
      } else if (data) {
        status = "expired"
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      status = message.includes("SUPABASE_SERVICE_ROLE_KEY") ? "missing-table" : "invalid"
    }
  }

  return (
    <AppShell>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className={surfaceCardClassName("w-full max-w-md p-6 sm:p-8")}>
          <Logo size="md" />
          {status === "ok" ? (
            <>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
                Creează-ți contul de terapeut
              </h1>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                {clinicName} te-a invitat{therapistName ? ` ca ${therapistName}` : ""}. Continuă cu
                Google sau introdu emailul personal și o parolă. Contul se creează acum, fără ca
                administratorul să-ți fi făcut unul dinainte.
              </p>
              <AcceptTherapistInviteForm token={token} initialError={therapistInviteReasonMessage(reason)} />
            </>
          ) : (
            <>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
                Invitație indisponibilă
              </h1>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                {status === "expired"
                  ? "Linkul a expirat sau a fost deja folosit. Cere administratorului clinicii un link nou pe WhatsApp sau SMS."
                  : status === "missing-table"
                    ? "Invitațiile nu sunt încă activate în baza de date. Administratorul trebuie să ruleze sql/027_therapist_invites.sql."
                    : "Linkul de invitație lipsește sau este invalid. Cere administratorului un mesaj nou."}
              </p>
              <LeaveUnavailableInviteButton />
            </>
          )}
        </div>
      </main>
    </AppShell>
  )
}
