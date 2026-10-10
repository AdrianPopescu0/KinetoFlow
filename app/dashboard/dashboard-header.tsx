"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Archive, BookOpen, ClipboardList, Shield, Users, type LucideIcon } from "lucide-react"

import { logout } from "@/app/dashboard/actions"
import { LogoutConfirmButton } from "@/components/auth/logout-confirm-button"
import { TherapistSettingsButton } from "@/components/dashboard/therapist-settings"
import { Logo } from "@/components/Logo"
import { cn } from "@/lib/utils"

type DashboardHeaderProps = {
  email?: string
  displayName: string
  clinicName?: string
  isAdmin?: boolean
}

type NavItem = {
  href: string
  label: string
  active: boolean
  icon: LucideIcon
}

export function DashboardHeader({ email, displayName, clinicName, isAdmin = false }: DashboardHeaderProps) {
  const pathname = usePathname()
  const patientsActive = pathname === "/dashboard" || pathname.startsWith("/dashboard/patients")
  const archiveActive = pathname === "/dashboard/arhiva" || pathname.startsWith("/dashboard/arhiva/")
  const exercisesActive = pathname.startsWith("/dashboard/exercises")
  const protocolsActive = pathname.startsWith("/dashboard/protocols")
  const teamActive = pathname.startsWith("/dashboard/echipa")
  const settingsActive = pathname.startsWith("/dashboard/setari")
  const label = clinicName ? `${displayName} · ${clinicName}` : displayName

  const mobileItems: NavItem[] = [
    { href: "/dashboard", label: "Pacienți", active: patientsActive, icon: Users },
    { href: "/dashboard/exercises", label: "Bibliotecă", active: exercisesActive, icon: BookOpen },
    { href: "/dashboard/protocols", label: "Protocoale", active: protocolsActive, icon: ClipboardList },
    ...(isAdmin
      ? [{ href: "/dashboard/echipa", label: "Echipă", active: teamActive, icon: Shield } satisfies NavItem]
      : []),
    { href: "/dashboard/arhiva", label: "Arhivă", active: archiveActive, icon: Archive },
  ]

  return (
    <>
      <header className="bg-[#042f2e] text-white">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/dashboard" prefetch className="min-w-0 shrink-0">
              <Logo size="sm" variant="onDark" className="sm:hidden" />
              <Logo size="md" variant="onDark" className="hidden sm:inline-flex" />
            </Link>
            <nav className="hidden items-center gap-1 sm:flex" aria-label="Navigare principală">
              <NavLink href="/dashboard" active={patientsActive}>
                Pacienți
              </NavLink>
              <NavLink href="/dashboard/exercises" active={exercisesActive}>
                Bibliotecă
              </NavLink>
              <NavLink href="/dashboard/protocols" active={protocolsActive}>
                Protocoale
              </NavLink>
              {isAdmin ? (
                <NavLink href="/dashboard/echipa" active={teamActive}>
                  Echipă
                </NavLink>
              ) : null}
              <NavLink href="/dashboard/arhiva" active={archiveActive}>
                Arhivă
              </NavLink>
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <p className="hidden max-w-[16rem] truncate text-sm text-teal-50/85 lg:block" title={email}>
              {label}
            </p>
            <TherapistSettingsButton active={settingsActive} />
            <LogoutConfirmButton
              label="Logout"
              triggerVariant="onDark"
              triggerClassName="h-11 min-h-[44px]"
              onConfirm={logout}
            />
          </div>
        </div>
      </header>

      <nav
        aria-label="Navigare mobilă"
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 sm:hidden",
          "border-t border-slate-200/90 bg-white/95 backdrop-blur-md",
          "dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)]/95",
          "pb-[env(safe-area-inset-bottom)]",
        )}
      >
        <ul className="mx-auto flex w-full max-w-7xl items-stretch justify-between px-1 pt-1">
          {mobileItems.map((item) => (
            <li key={item.href} className="min-w-0 flex-1">
              <MobileNavLink {...item} />
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}

function MobileNavLink({
  href,
  active,
  label,
  icon: Icon,
}: NavItem) {
  return (
    <Link
      href={href}
      prefetch
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 px-1 py-1.5",
        "text-[10px] font-medium leading-tight tracking-wide",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#042f2e]/35 focus-visible:ring-offset-1",
        "dark:focus-visible:ring-teal-400/40",
        active
          ? "text-[#042f2e] dark:text-teal-300"
          : "text-slate-500 hover:text-slate-800 dark:text-[var(--kf-text-muted)] dark:hover:text-[var(--kf-text)]",
      )}
    >
      <Icon
        className={cn("size-[1.35rem] shrink-0", active && "stroke-[2.25]")}
        aria-hidden="true"
      />
      <span className="max-w-full truncate">{label}</span>
    </Link>
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
