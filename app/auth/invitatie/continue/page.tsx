"use client"

import { ResumeTherapistInviteAfterAuth } from "@/components/auth/pending-therapist-invite"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Logo } from "@/components/Logo"

export default function TherapistInviteContinuePage() {
  return (
    <AppShell>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className={surfaceCardClassName("w-full max-w-md p-6 sm:p-8")}>
          <Logo size="md" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
            Intrăm în clinica ta
          </h1>
          <p className="mt-2 mb-4 text-sm leading-relaxed text-slate-600">
            Verificăm invitația salvată și te ducem în dashboard-ul clinicii, fără să creezi un
            cabinet nou.
          </p>
          <ResumeTherapistInviteAfterAuth />
        </div>
      </main>
    </AppShell>
  )
}
