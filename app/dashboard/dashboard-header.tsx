import Link from "next/link"

import { logout } from "@/app/dashboard/actions"
import { KinetoFlowMark } from "@/components/patient/kinetoflow-mark"
import { Button } from "@/components/ui/button"
import { therapistDisplayName } from "@/lib/patients/display"

type DashboardHeaderProps = {
  email?: string
  metadataName?: string
}

export function DashboardHeader({ email, metadataName }: DashboardHeaderProps) {
  const name = therapistDisplayName(email, metadataName)

  return (
    <header className="bg-[#042f2e] text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <KinetoFlowMark className="size-8 text-white" />
          <span className="text-sm font-semibold tracking-[0.16em] uppercase">KinetoFlow</span>
        </Link>
        <div className="flex items-center gap-3">
          <p className="hidden max-w-[12rem] truncate text-sm text-teal-50/85 sm:block">{name}</p>
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
    </header>
  )
}
