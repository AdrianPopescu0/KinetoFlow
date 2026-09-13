import type { Metadata } from "next"
import { Loader2 } from "lucide-react"

import { CaptureOAuthSession } from "@/components/auth/capture-oauth-session"

export const metadata: Metadata = {
  title: "Se conectează | KinetoFlow",
  description: "Finalizăm autentificarea cu Google.",
}

export default function OAuthSessionPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col items-center justify-center bg-slate-50 px-5 py-16">
      <CaptureOAuthSession mode="complete" />
      <p className="flex items-center gap-2 text-sm text-slate-600">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Salvăm sesiunea și te ducem în clinică…
      </p>
    </div>
  )
}
