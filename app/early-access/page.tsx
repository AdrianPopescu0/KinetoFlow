import { redirect } from "next/navigation"
import { KeyRound } from "lucide-react"

import { AppShell } from "@/components/brand/app-atmosphere"
import { RecoverSessionRedirect } from "@/components/auth/recover-session-redirect"
import { EarlyAccessForm } from "@/components/landing/early-access-form"
import { LandingHeader } from "@/components/landing/landing-header"
import { isEmailConfirmedUser } from "@/lib/auth/email-confirmed"
import { resolveTherapistAppPath } from "@/lib/auth/redirect-after"
import { getCachedUser } from "@/lib/auth/session"

export const metadata = {
  title: "Early Access — KinetoFlow",
  description: "Introduceți codul de acces timpuriu pentru a continua către autentificare.",
}

export default async function EarlyAccessPage() {
  let confirmedUser = false
  try {
    const { user } = await getCachedUser()
    confirmedUser = Boolean(user && isEmailConfirmedUser(user))
  } catch {
    confirmedUser = false
  }
  if (confirmedUser) {
    redirect(await resolveTherapistAppPath())
  }

  return (
    <AppShell>
      <RecoverSessionRedirect />
      <LandingHeader />
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-800">
                Acces timpuriu
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                Cod de înregistrare
              </h1>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                KinetoFlow este în Early Access. Introduceți codul secret de 12 caractere
                primit de la noi. După validare intrați cu email și parolă. Codul de 6
                cifre pe email se cere doar la crearea unui cont nou.
              </p>
            </div>
          </div>
          <EarlyAccessForm autoFocus />
        </div>
      </main>
    </AppShell>
  )
}
