import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AccountSettingsForm } from "@/app/dashboard/setari/account-settings-form"
import { surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { ThemePreferenceSection } from "@/components/theme/dashboard-theme"
import { getCachedUser } from "@/lib/auth/session"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { isClinicAdmin } from "@/lib/clinics/types"
import { therapistDisplayName } from "@/lib/patients/display"

export const metadata: Metadata = {
  title: "Setări cont | KinetoFlow",
}

export default async function AccountSettingsPage() {
  const { supabase, user } = await getCachedUser()
  if (!user) {
    redirect("/login")
  }

  const { profile, error } = await fetchClinicProfile(supabase, user.id)
  const metadataName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined
  const metadataPhone = typeof user.user_metadata?.phone === "string" ? user.user_metadata.phone : ""
  const therapistName = profile?.therapist_name?.trim() || therapistDisplayName(user.email, metadataName)
  const clinicName =
    profile?.clinic_name?.trim() ||
    (typeof user.user_metadata?.clinic_name === "string" ? user.user_metadata.clinic_name.trim() : "")
  const phone = profile?.phone?.trim() || metadataPhone
  const email = user.email ?? ""
  const isAdmin = isClinicAdmin(profile)

  return (
    <main className="mx-auto flex w-full min-w-0 max-w-3xl flex-1 flex-col gap-6 overflow-x-hidden px-5 py-8">
      <div>
        <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase dark:text-teal-300">Cont terapeut</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-800 dark:text-[var(--kf-text)]">Setări</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">
          {isAdmin
            ? "Tema panoului, datele personale, parola și numele clinicii."
            : "Tema panoului, datele personale și parola."}
        </p>
      </div>

      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200" role="alert">
          {error}
        </section>
      ) : !profile ? (
        <>
          <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            Profilul clinicii nu este configurat. Revino la onboarding ca să salvezi cabinetul, apoi poți edita setările
            contului.
          </section>
          <section className={surfaceCardClassName("p-5 sm:p-6")}>
            <ThemePreferenceSection
              standalone
              description="Comută între luminos și întuneric sau lasă tema să urmeze dispozitivul. Se aplică imediat pe tot panoul."
            />
          </section>
        </>
      ) : (
        <section className={surfaceCardClassName("p-5 sm:p-6")}>
          <AccountSettingsForm
            email={email || "—"}
            therapistName={therapistName}
            phone={phone}
            clinicName={clinicName}
            isAdmin={isAdmin}
          />
        </section>
      )}
    </main>
  )
}
