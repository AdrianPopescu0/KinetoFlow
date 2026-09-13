"use client"

import { usePathname } from "next/navigation"

import { CaptureOAuthSession } from "@/components/auth/capture-oauth-session"

/**
 * Dacă Google lasă tokenii pe landing (Site URL = `/`) sau sesiunea e deja
 * în client, ducem terapeutul în dashboard după `onAuthStateChange`.
 */
export function RecoverSessionRedirect() {
  const pathname = usePathname()
  if (pathname !== "/") {
    return null
  }
  return <CaptureOAuthSession mode="landing" />
}
