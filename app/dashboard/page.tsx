import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { logout } from "@/app/dashboard/actions"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"
import { Button } from "@/components/ui/button"
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

  return (
    <AppShell>
      <header className="bg-[#042f2e] text-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-5 py-4">
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

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Dashboard clinic</h1>
          <p className="mt-1 text-sm text-slate-600">
            Ești autentificat ca <span className="font-medium text-slate-800">{user.email}</span>
          </p>
        </div>

        <section className={surfaceCardClassName("p-6")}>
          <h2 className="text-base font-semibold text-slate-800">Sesiune activă</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Middleware-ul reîmprospătează sesiunea la fiecare cerere. Rutele din{" "}
            <code className="rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-xs text-slate-800">
              /dashboard
            </code>{" "}
            sunt accesibile doar utilizatorilor autentificați.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className={surfaceCardClassName("p-5")}>
            <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">
              Program pacienți
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-800">Linkuri personale</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Pacienții își văd exercițiile și trimit check-in-ul din{" "}
              <span className="font-medium text-slate-800">/p/[token]</span>.
            </p>
          </article>
          <article className={surfaceCardClassName("p-5")}>
            <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase">Securitate</p>
            <p className="mt-2 text-lg font-semibold text-slate-800">Acces clinic</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Autentificarea rămâne pe Supabase Auth. Dashboard-ul nu este vizibil fără sesiune
              validă.
            </p>
          </article>
        </section>
      </main>
    </AppShell>
  )
}
