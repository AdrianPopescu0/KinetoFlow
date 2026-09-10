"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import { enterTherapistApp } from "@/lib/auth/oauth-redirect"
import { createClient } from "@/utils/supabase/client"

/**
 * Dacă Google lasă sesiunea pe landing (Site URL = `/`), ducem terapeutul
 * în dashboard printr-un document request — fără buclă pe `/login`.
 */
export function RecoverSessionRedirect() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/" && pathname !== "/early-access") {
      return
    }

    const supabase = createClient()
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        enterTherapistApp("/dashboard")
      }
    })
  }, [pathname])

  return null
}
