import type { ReactNode } from "react"
import Link from "next/link"

import { logout } from "@/app/dashboard/actions"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"
import { Button } from "@/components/ui/button"
import { fetchClinicProfile } from "@/lib/clinics/profile"
import { therapistDisplayName } from "@/lib/patients/display"
import { cn } from "@/lib/utils"
import { createClient } from "@/utils/supabase/server"

type DashboardHeaderProps = {
  email?: string
  metadataName?: string
  current?: "dashboard" | "exercises"
}

export async function DashboardHeader({
  email,
  metadataName,
  current = "dashboard",
}: DashboardHeaderProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const clinic = user ? await fetchClinicProfile(supabase, user.id) : { profile: null }
  const name = therapistDisplayName(
    email,
    clinic.profile?.therapist_name ?? metadataName,
  )

  return (
    <header className="bg-[#042f2e] text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <KinetoFlowMark className="size-8 text-white" />
            <span className="text-sm font-semibold tracking-[0.16em] uppercase">KinetoFlow</span>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink href="/dashboard" active={current === "dashboard"}>
              Pacienți
            </NavLink>
            <NavLink href="/dashboard/exercises" active={current === "exercises"}>
              Bibliotecă
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <p className="hidden max-w-[12rem] truncate text-sm text-teal-50/85 lg:block">{name}</p>
          <form action={logout}>
            <Button
              type="submit"
              variant="outline"
              className="h-11 min-h-[44px] rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              Logout
            </Button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 border-t border-white/10 px-5 py-2 sm:hidden">
        <NavLink href="/dashboard" active={current === "dashboard"}>
          Pacienți
        </NavLink>
        <NavLink href="/dashboard/exercises" active={current === "exercises"}>
          Bibliotecă
        </NavLink>
      </nav>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium",
        active ? "bg-white/15 text-white" : "text-teal-50/80 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </Link>
  )
}
