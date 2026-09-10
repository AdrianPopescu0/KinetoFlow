"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { SIGNED_OUT_GATE_COOKIE } from "@/lib/auth/oauth-redirect"
import { createClient } from "@/utils/supabase/client"

function hasSignedOutGate(): boolean {
  if (typeof document === "undefined") {
    return false
  }
  return document.cookie.split(";").some((part) => part.trim().startsWith(`${SIGNED_OUT_GATE_COOKIE}=1`))
}

/**
 * Dacă Google/OAuth lasă sesiunea pe `/` (Site URL) sau pe `/login`,
 * ducem terapeutul în dashboard, nu pe landing.
 */
export function RecoverSessionRedirect({ stayOnPage = false }: { stayOnPage?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (stayOnPage || hasSignedOutGate()) {
      return
    }
    if (pathname !== "/" && pathname !== "/login" && pathname !== "/early-access") {
      return
    }

    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.replace("/dashboard")
      }
    })
  }, [pathname, router, stayOnPage])

  return null
}
