import type { Metadata } from "next"

import { AppShell } from "@/components/brand/app-atmosphere"
import { LandingCta } from "@/components/landing/landing-cta"
import { LandingFeatures } from "@/components/landing/landing-features"
import { LandingHeader } from "@/components/landing/landing-header"
import { LandingHero } from "@/components/landing/landing-hero"

export const metadata: Metadata = {
  title: "KinetoFlow — optimizează activitatea clinicii",
  description:
    "Platformă pentru kinetoterapie: gestionează pacienții, programele de recuperare și echipa. Acces timpuriu pe bază de cod.",
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ unlock?: string }>
}) {
  const { unlock } = await searchParams

  return (
    <AppShell>
      <LandingHeader />
      <main className="flex flex-1 flex-col">
        <LandingHero unlockOpen={unlock === "1"} />
        <LandingFeatures />
        <LandingCta />
      </main>
    </AppShell>
  )
}
