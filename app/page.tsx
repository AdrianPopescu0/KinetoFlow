import type { Metadata } from "next"

import { RecoverSessionRedirect } from "@/components/auth/recover-session-redirect"
import { LandingAbout } from "@/components/landing/landing-about"
import { LandingCta } from "@/components/landing/landing-cta"
import { LandingFaq } from "@/components/landing/landing-faq"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"
import { LandingShell } from "@/components/landing/landing-shell"
import { LandingStats } from "@/components/landing/landing-stats"

export const metadata: Metadata = {
  title: "KinetoFlow — optimizează activitatea clinicii",
  description:
    "KinetoFlow – Fluxul mișcării și al recuperării. Platformă pentru kinetoterapie: gestionează pacienții, programele de recuperare și echipa.",
}

export default function HomePage() {
  return (
    <LandingShell>
      <RecoverSessionRedirect />
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <LandingAbout />
        <LandingStats />
        <LandingFeatures />
        <LandingCta />
        <LandingFaq />
      </main>
    </LandingShell>
  )
}
