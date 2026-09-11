import type { Metadata } from "next"

import { AcceptTherapistInviteForm } from "@/app/auth/invitatie/accept-form"
import { LeaveUnavailableInviteButton } from "@/app/auth/invitatie/leave-unavailable-button"
import { PersistTherapistInviteToken } from "@/components/auth/pending-therapist-invite"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Logo } from "@/components/Logo"
import { createServiceRoleClient } from "@/utils/supabase/admin"
import { therapistInviteActivationError } from "@/lib/clinics/invite-attach"
import { therapistInvitePersistScript } from "@/lib/clinics/invite-session"
import {
  isMissingTherapistInvitesTable,
  isTherapistInviteOpen,
  isTherapistInviteToken,
} from "@/lib/clinics/therapist-invite"

export const metadata: Metadata = {
  title: "Invitație în clinică | KinetoFlow",
  description: "Activează-ți contul de terapeut cu parola aleasă. Fără cod pe email.",
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
  let inviteEmail: string | null = null

  if (isTherapistInviteToken(token)) {
    try {
      const admin = createServiceRoleClient()
      const withEmail = await admin
        .from("therapist_invites")
        .select("clinic_name, therapist_name, email, expires_at, accepted_at")
        .eq("token", token)
        .maybeSingle()
      const missingEmailColumn =
        withEmail.error &&
        (withEmail.error.code === "PGRST204" ||
          (withEmail.error.message ?? "").toLowerCase().includes("email"))
      const { data, error } = missingEmailColumn
        ? await admin
            .from("therapist_invites")
            .select("clinic_name, therapist_name, expires_at, accepted_at")
            .eq("token", token)
            .maybeSingle()
        : withEmail

      if (error && isMissingTherapistInvitesTable(error)) {
        status = "missing-table"
      } else if (data && isTherapistInviteOpen(data)) {
        status = "ok"
        clinicName = String(data.clinic_name ?? "").trim()
        therapistName = String(data.therapist_name ?? "").trim()
        const raw = "email" in data && typeof data.email === "string" ? data.email.trim().toLowerCase() : ""
        inviteEmail = raw || null
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
          {isTherapistInviteToken(token) ? (
            <>
              <script dangerouslySetInnerHTML={{ __html: therapistInvitePersistScript(token) }} />
              <PersistTherapistInviteToken token={token} />
            </>
          ) : null}
          <Logo size="md" />
          {status === "ok" ? (
            <>
              <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
                Activează-ți contul de terapeut
              </h1>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                {clinicName} te-a invitat{therapistName ? ` ca ${therapistName}` : ""}. Alege o parolă
                pentru {inviteEmail ?? "adresa din invitație"} — fără cod pe email — și intri direct
                în dashboard-ul clinicii.
              </p>
              <AcceptTherapistInviteForm
                token={token}
                inviteEmail={inviteEmail}
                initialError={therapistInviteActivationError(reason)}
              />
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
