import type { Metadata } from "next"

import { RecoverSessionRedirect } from "@/components/auth/recover-session-redirect"
import { LandingCta } from "@/components/landing/landing-cta"
import { LandingFaq } from "@/components/landing/landing-faq"
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
    <div
      data-landing-page
      className="flex min-h-0 max-w-full flex-1 flex-col overflow-x-hidden scroll-smooth bg-[#0c1615] text-[#e8eeed]"
    >
      <RecoverSessionRedirect />
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <LandingHero />
        <LandingFeatures />
        <LandingCta />
        <LandingFaq />
      </main>
    </div>
  )
}
