import type { Metadata } from "next"

import { AppShell } from "@/components/brand/app-atmosphere"
import { RecoverSessionRedirect } from "@/components/auth/recover-session-redirect"
import { LandingCta } from "@/components/landing/landing-cta"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"

export const metadata: Metadata = {
  title: "KinetoFlow — optimizează activitatea clinicii",
  description:
    "KinetoFlow – Fluxul mișcării și al recuperării. Platformă pentru kinetoterapie: gestionează pacienții, programele de recuperare și echipa.",
}

export default function HomePage() {
  return (
    <AppShell>
      <RecoverSessionRedirect />
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <LandingFeatures />
        <LandingCta />
      </main>
    </AppShell>
  )
}
