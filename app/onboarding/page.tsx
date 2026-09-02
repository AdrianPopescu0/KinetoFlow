import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { OnboardingForm } from "@/app/onboarding/onboarding-form"
import { logout } from "@/app/dashboard/actions"
import { Logo } from "@/components/Logo"
import { PendingSubmitButton } from "@/components/ui/pending-submit-button"
import { getCachedUser } from "@/lib/auth/session"
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

  const { profile, error: clinicLoadError } = await fetchClinicProfile(supabase, user.id)
  if (profile) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between">
          <Logo size="md" />
          <form action={logout}>
            <PendingSubmitButton type="submit" variant="outline" pendingLabel="Ieșire…" className="h-10 rounded-xl">
              Ieșire
            </PendingSubmitButton>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 py-10">
        <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Prima configurare</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Datele clinicii
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Completăm o singură dată profilul cabinetului. Apoi ajungi direct în dashboard.
          {user.email ? (
            <>
              {" "}
              Cont: <span className="font-medium text-slate-800">{user.email}</span>
            </>
          ) : null}
        </p>

        {clinicLoadError ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Nu am putut citi profilul clinicii: {clinicLoadError}
          </p>
        ) : null}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <OnboardingForm />
        </div>
      </main>
    </div>
  )
}
