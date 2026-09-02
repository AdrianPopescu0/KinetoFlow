import type { ReactNode } from "react"
import { redirect } from "next/navigation"

import { DashboardHeader } from "@/app/dashboard/dashboard-header"
import { AppShell } from "@/components/brand/app-atmosphere"
import { getCachedUser } from "@/lib/auth/session"
import { therapistDisplayName } from "@/lib/patients/display"

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = await getCachedUser()
  if (!user) {
    redirect("/login")
  }

  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined
  const clinicName =
    typeof user.user_metadata?.clinic_name === "string" ? user.user_metadata.clinic_name : undefined

  return (
    <AppShell>
      <DashboardHeader
        email={user.email}
        displayName={therapistDisplayName(user.email, metadataName)}
        clinicName={clinicName}
      />
      {children}
    </AppShell>
  )
}
