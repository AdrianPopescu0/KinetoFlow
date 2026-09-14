"use client"

import { useEffect } from "react"
import { Loader2 } from "lucide-react"

import {
  clearTherapistAppEnterGuard,
  persistTherapistSessionAndEnter,
} from "@/lib/auth/oauth-redirect"
import { createClient } from "@/utils/supabase/client"

/**
 * Dacă layout-ul nu vede cookie-urile (frecvent pe mobil după login),
 * citim sesiunea din client și abia apoi mergem în dashboard.
 */
export function TherapistSessionBridge({ next = "/dashboard" }: { next?: string }) {
  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    void (async () => {
      const entered = await persistTherapistSessionAndEnter(supabase, next)
      if (cancelled) {
        return
      }
      if (!entered) {
        clearTherapistAppEnterGuard()
        window.location.replace("/login")
      }
    })()

    return () => {
      cancelled = true
    }
  }, [next])

  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center gap-3 px-5 py-16 text-sm text-slate-600">
      <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      Restaurăm sesiunea și te ducem în dashboard…
    </div>
  )
}

export function ClearTherapistAppEnterGuard() {
  useEffect(() => {
    clearTherapistAppEnterGuard()
  }, [])
  return null
}
