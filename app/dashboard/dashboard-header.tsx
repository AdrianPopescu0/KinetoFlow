"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { InviteTherapistDialog } from "@/app/dashboard/echipa/invite-therapist-dialog"
import { logout } from "@/app/dashboard/actions"
import { Logo } from "@/components/Logo"
import { PendingSubmitButton } from "@/components/ui/pending-submit-button"
import { cn } from "@/lib/utils"

type DashboardHeaderProps = {
  email?: string
  displayName: string
  clinicName?: string
  isAdmin?: boolean
}

export function DashboardHeader({ email, displayName, clinicName, isAdmin = false }: DashboardHeaderProps) {
  const pathname = usePathname()
  const patientsActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/patients")
  const exercisesActive = pathname.startsWith("/dashboard/exercises")
  const teamActive = pathname.startsWith("/dashboard/echipa")
  const label = clinicName ? `${displayName} · ${clinicName}` : displayName

  return (
    <header className="bg-[#042f2e] text-white">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" prefetch className="flex items-center">
            <Logo size="md" variant="onDark" />
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            <NavLink href="/dashboard" active={patientsActive}>
              Pacienți
            </NavLink>
            <NavLink href="/dashboard/exercises" active={exercisesActive}>
              Bibliotecă
            </NavLink>
            {isAdmin ? (
              <NavLink href="/dashboard/echipa" active={teamActive}>
                Echipă
              </NavLink>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin ? (
            <InviteTherapistDialog
              triggerLabel="Adaugă Terapeut"
              triggerClassName="border-white/20 bg-white text-[#042f2e] hover:bg-teal-50"
            />
          ) : null}
          <p className="hidden max-w-[16rem] truncate text-sm text-teal-50/85 lg:block" title={email}>
            {label}
          </p>
          <form action={logout}>
            <PendingSubmitButton
              type="submit"
              variant="outline"
              pendingLabel="Ieșire…"
              className="h-11 min-h-[44px] rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white"
            >
              Logout
            </PendingSubmitButton>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 border-t border-white/10 px-5 py-2 sm:hidden">
        <NavLink href="/dashboard" active={patientsActive}>
          Pacienți
        </NavLink>
        <NavLink href="/dashboard/exercises" active={exercisesActive}>
          Bibliotecă
        </NavLink>
        {isAdmin ? (
          <NavLink href="/dashboard/echipa" active={teamActive}>
            Echipă
          </NavLink>
        ) : null}
      </nav>
    </header>
  )
}

function NavLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      prefetch
      className={cn(
        "rounded-lg px-3 py-2 text-sm font-medium",
        active ? "bg-white/15 text-white" : "text-teal-50/80 hover:bg-white/10 hover:text-white",
      )}
    >
      {children}
    </Link>
  )
}
