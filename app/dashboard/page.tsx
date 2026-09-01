import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { logout } from "@/app/dashboard/actions"
import { AddPatientDialog } from "@/app/dashboard/add-patient-dialog"
import { PatientList } from "@/app/dashboard/patient-list"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"
import { Button } from "@/components/ui/button"
import { listTherapistPatients } from "@/lib/patients/queries"
import { createClient } from "@/utils/supabase/server"

export const metadata: Metadata = {
  title: "Dashboard | KinetoFlow",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { patients, error, needsMigration } = await listTherapistPatients()

  return (
    <AppShell>
      <header className="bg-[#042f2e] text-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-white" />
            <p className="text-sm font-semibold tracking-[0.16em] uppercase">KinetoFlow</p>
          </div>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              className="h-11 min-h-[44px] rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              Ieși din cont
            </Button>
          </form>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-5 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
              Dashboard clinic
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Ești autentificat ca <span className="font-medium text-slate-800">{user.email}</span>
            </p>
          </div>
          <AddPatientDialog />
        </div>

        <section className={surfaceCardClassName("overflow-hidden")}>
          <div className="flex flex-col gap-1 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-slate-800">Pacienți activi</h2>
              <p className="text-sm text-slate-600">
                Copiază linkul personal — pacientul intră pe program fără parolă.
              </p>
            </div>
            <p className="text-sm font-medium text-slate-500">{patients.length} pacienți</p>
          </div>
          {error ? (
            <p className="px-5 py-6 text-sm text-red-800" role="alert">
              {error}
              {needsMigration ? (
                <span className="mt-2 block text-slate-600">
                  Deschide SQL Editor în Supabase și rulează fișierul{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    supabase/migrations/001_patients.sql
                  </code>
                  .
                </span>
              ) : null}
            </p>
          ) : (
            <PatientList patients={patients} />
          )}
        </section>
      </main>
    </AppShell>
  )
}
