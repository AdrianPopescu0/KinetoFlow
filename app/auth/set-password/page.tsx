import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { SetPasswordForm } from "@/app/auth/set-password/set-password-form"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Logo } from "@/components/Logo"
import { getCachedUser } from "@/lib/auth/session"

export const metadata: Metadata = {
  title: "Setează parola | KinetoFlow",
  description: "Alege parola contului de terapeut KinetoFlow.",
}

export default async function SetPasswordPage() {
  const { user } = await getCachedUser()
  if (!user) {
    redirect("/login?reason=otp_expired")
  }

  return (
    <AppShell>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className={surfaceCardClassName("w-full max-w-md p-6 sm:p-8")}>
          <Logo size="md" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
            Alege-ți parola
          </h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
            Contul tău din echipa clinicii e activ. Setează o parolă ca să poți intra și de pe
            alte dispozitive.
          </p>
          <SetPasswordForm />
        </div>
      </main>
    </AppShell>
  )
}
