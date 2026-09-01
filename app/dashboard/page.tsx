import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { logout } from "@/app/dashboard/actions"
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-5 py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.16em] text-primary uppercase">
            KinetoFlow
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Dashboard clinic</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ești autentificat ca{" "}
            <span className="font-medium text-foreground">{user.email}</span>
          </p>
        </div>
        <form action={logout}>
          <Button type="submit" variant="outline" className="h-10">
            Ieși din cont
          </Button>
        </form>
      </header>

      <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-base font-semibold">Sesiune activă</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Middleware-ul reîmprospătează sesiunea la fiecare cerere. Rutele din{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">/dashboard</code> sunt
          accesibile doar utilizatorilor autentificați.
        </p>
      </section>
    </main>
  )
}
