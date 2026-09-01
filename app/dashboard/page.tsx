import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { logout } from "@/app/dashboard/actions"
import { AppAtmosphere, glassCardClassName } from "@/components/brand/app-atmosphere"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"

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
    <AppAtmosphere>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-8 sm:py-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <KinetoFlowMark className="mt-0.5 size-9 text-teal-300" />
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-teal-100/80 uppercase">
                KinetoFlow
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                Dashboard clinic
              </h1>
              <p className="mt-1 text-sm text-emerald-100/70">
                Ești autentificat ca{" "}
                <span className="font-medium text-white">{user.email}</span>
              </p>
            </div>
          </div>
          <form action={logout}>
            <Button type="submit" variant="outline" className="h-12 min-h-[48px] rounded-xl px-4">
              Ieși din cont
            </Button>
          </form>
        </header>

        <section className={glassCardClassName("p-6")}>
          <h2 className="text-base font-semibold text-white">Sesiune activă</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">
            Middleware-ul reîmprospătează sesiunea la fiecare cerere. Rutele din{" "}
            <code className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs text-teal-200">
              /dashboard
            </code>{" "}
            sunt accesibile doar utilizatorilor autentificați.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className={glassCardClassName("p-5")}>
            <p className="text-xs font-semibold tracking-wide text-teal-300 uppercase">
              Program pacienți
            </p>
            <p className="mt-2 text-lg font-semibold text-white">Linkuri personale</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Pacienții își văd exercițiile și trimit check-in-ul din{" "}
              <span className="text-emerald-100">/p/[token]</span>, pe aceeași identitate vizuală.
            </p>
          </article>
          <article className={glassCardClassName("p-5")}>
            <p className="text-xs font-semibold tracking-wide text-teal-300 uppercase">Securitate</p>
            <p className="mt-2 text-lg font-semibold text-white">Acces clinic</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-300">
              Autentificarea rămâne pe Supabase Auth. Dashboard-ul nu este vizibil fără sesiune
              validă.
            </p>
          </article>
        </section>
      </main>
    </AppAtmosphere>
  )
}
