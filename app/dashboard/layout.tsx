import type { ReactNode } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/app/dashboard/dashboard-header"
import { AppShell } from "@/components/brand/app-atmosphere"
import { ClearSettledTherapistInvite } from "@/components/auth/pending-therapist-invite"
import { DashboardThemeProvider } from "@/components/theme/dashboard-theme"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { getCachedUser } from "@/lib/auth/session"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { isClinicAdmin } from "@/lib/clinics/types"
import { therapistDisplayName } from "@/lib/patients/display"
import { parseThemePreference, THEME_COOKIE_NAME } from "@/lib/theme/preference"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    redirect("/login")
  }
  if (!isEmailConfirmedUser(user)) {
    redirect("/login?reason=confirm_email")
  }

  const { profile } = await fetchClinicProfile(supabase, user.id)
  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined
  const clinicName =
    profile?.clinic_name ??
    (typeof user.user_metadata?.clinic_name === "string" ? user.user_metadata.clinic_name : undefined)
  const jar = await cookies()
  const initialPreference = parseThemePreference(
    jar.get(THEME_COOKIE_NAME)?.value,
    user.user_metadata?.theme,
  )

  return (
    <AppShell>
      <DashboardThemeProvider initialPreference={initialPreference}>
        <ClearSettledTherapistInvite />
        <DashboardHeader
          email={user.email}
          displayName={therapistDisplayName(user.email, profile?.therapist_name ?? metadataName)}
          clinicName={clinicName}
          isAdmin={isClinicAdmin(profile)}
        />
        {children}
      </DashboardThemeProvider>
    </AppShell>
  )
}
