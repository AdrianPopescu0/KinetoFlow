import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { OnboardingClient } from "@/app/onboarding/onboarding-client"
import { logout } from "@/app/dashboard/actions"
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button"
import { InvitedTherapistOnboardingGate } from "@/components/auth/pending-therapist-invite"
import { Logo } from "@/components/Logo"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { getCachedUser } from "@/lib/auth/session"
import { attachTherapistInviteToUser } from "@/lib/clinics/attach-therapist-invite"
import { invitedTherapistFromUser } from "@/lib/clinics/clinic-ready"
import { readTherapistInviteToken } from "@/lib/clinics/invite-attach"
import {
  THERAPIST_INVITE_CLIENT_COOKIE,
  THERAPIST_INVITE_COOKIE,
  inviteTokenFromAuthUser,
} from "@/lib/clinics/invite-session"
import { ensureExistingClinicMembership } from "@/lib/clinics/membership"
import { fetchClinicProfile } from "@/lib/clinics/profile"

export const metadata: Metadata = {
  title: "Configurare clinică | KinetoFlow",
  description: "Completează datele cabinetului înainte de a intra în dashboard.",
}

export default async function OnboardingPage() {
  const { supabase, user } = await getCachedUser()

  if (!user) {
    redirect("/login")
  }
  if (!isEmailConfirmedUser(user)) {
    redirect("/login?reason=confirm_email")
  }

  const jar = await cookies()
  const inviteToken = readTherapistInviteToken(
    null,
    jar.get(THERAPIST_INVITE_COOKIE)?.value,
    jar.get(THERAPIST_INVITE_CLIENT_COOKIE)?.value,
    inviteTokenFromAuthUser(user),
  )
  if (inviteToken) {
    const attachedByToken = await attachTherapistInviteToUser({ token: inviteToken, user })
    if (attachedByToken.ok) {
      await supabase.auth.refreshSession()
    }
    redirect("/dashboard")
  }

  const attached = await attachTherapistInviteToUser({ user })
  if (attached.ok) {
    await supabase.auth.refreshSession()
    redirect("/dashboard")
  }

  if (invitedTherapistFromUser(user)) {
    redirect("/dashboard")
  }

  const { profile, error: clinicLoadError } = await fetchClinicProfile(supabase, user.id)
  if (profile) {
    redirect("/dashboard")
  }

  if (await ensureExistingClinicMembership(user)) {
    await supabase.auth.refreshSession()
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between">
          <Logo size="md" />
          <LogoutConfirmButton
            label="Ieșire"
            triggerClassName="h-10 min-h-10"
            onConfirm={logout}
          />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
        <InvitedTherapistOnboardingGate>
          <OnboardingClient email={user.email} clinicLoadError={clinicLoadError} />
        </InvitedTherapistOnboardingGate>
      </main>
    </div>
  )
}
