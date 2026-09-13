"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { logout } from "@/app/dashboard/actions"
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button"
import { Logo } from "@/components/Logo"
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
  const archiveActive = pathname === "/dashboard/arhiva" || pathname.startsWith("/dashboard/arhiva/")
  const exercisesActive = pathname.startsWith("/dashboard/exercises")
  const teamActive = pathname.startsWith("/dashboard/echipa")
  const settingsActive = pathname.startsWith("/dashboard/setari")
  const label = clinicName ? `${displayName} · ${clinicName}` : displayName

  return (
    <header className="bg-[#042f2e] text-white">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" prefetch className="min-w-0 shrink-0">
            <Logo size="sm" variant="onDark" className="sm:hidden" />
            <Logo size="md" variant="onDark" className="hidden sm:inline-flex" />
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
            <NavLink href="/dashboard/arhiva" active={archiveActive}>
              Arhivă
            </NavLink>
            <NavLink href="/dashboard/setari" active={settingsActive}>
              Setări
            </NavLink>
          </nav>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <p className="hidden max-w-[16rem] truncate text-sm text-teal-50/85 lg:block" title={email}>
            {label}
          </p>
          <LogoutConfirmButton
            label="Logout"
            triggerVariant="onDark"
            triggerClassName="h-11 min-h-[44px]"
            onConfirm={logout}
          />
        </div>
      </div>
      <nav className="flex flex-wrap gap-1 border-t border-white/10 px-4 py-2 sm:hidden">
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
        <NavLink href="/dashboard/arhiva" active={archiveActive}>
          Arhivă
        </NavLink>
        <NavLink href="/dashboard/setari" active={settingsActive}>
          Setări
        </NavLink>
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
