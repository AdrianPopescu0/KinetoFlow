import Image from "next/image"
import Link from "next/link"

import { LandingHeroArt } from "@/components/landing/landing-hero-art"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const highlights = [
  { label: "Fișe și note clinice", detail: "Pacienții cabinetului, într-un singur loc" },
  { label: "Programe cu video", detail: "Exerciții prescrise, urmărite zilnic" },
  { label: "Echipă de clinică", detail: "Terapeuți invitați, același flux" },
]

export function LandingHero() {
  return (
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden">
      <Image
        src="/landing/hero-recovery.jpg"
        alt="Terapeut care urmărește un pacient în timpul unui exercițiu de recuperare pe reformer"
        fill
        priority
        sizes="100vw"
        className="object-cover object-[68%_40%] sm:object-[78%_42%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(90deg,#071412_0%,#0c1615e6_38%,#042f2ecc_62%,#042f2e66_100%)] sm:bg-[linear-gradient(105deg,#071412_0%,#0c1615f2_34%,#042f2ed9_54%,#042f2e40_78%,transparent_100%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(45,212,191,0.18),transparent_42%)]"
      />
      <div className="pointer-events-none absolute inset-0 opacity-80">
        <LandingHeroArt />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold tracking-[0.2em] text-teal-300 uppercase">
            Platformă clinică pentru kinetoterapie
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-balance text-white sm:text-6xl sm:leading-[1.05]">
            Optimizează activitatea. Gestionează recuperarea dintr-un singur loc.
          </h1>
          <p className="mt-5 text-lg font-medium tracking-tight text-pretty text-teal-200 sm:text-2xl">
            KinetoFlow – Fluxul mișcării și al recuperării.
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-teal-50/80 sm:text-lg">
            KinetoFlow aduce pacienții, programele de exerciții și echipa clinicii în același flux de
            lucru. Intră în cont sau înregistrează cabinetul, apoi gestionezi recuperarea fără hârtii
            și fără un al doilea sistem.
          </p>
          <div className="mt-9 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row">
            <Link
              href="/login"
              prefetch
              className={cn(
                buttonVariants(),
                "h-12 min-h-[48px] rounded-xl bg-teal-400 px-7 text-base text-[#042f2e] hover:bg-teal-300",
              )}
            >
              Intră în cont
            </Link>
            <Link
              href="/login?mode=signup"
              prefetch
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-12 min-h-[48px] rounded-xl border-white/20 bg-white/5 px-7 text-base text-white hover:bg-white/10",
              )}
            >
              Înregistrează clinică
            </Link>
          </div>
          <p className="mt-5 text-sm text-teal-100/70">
            Ești pacient?{" "}
            <Link href="/acces" prefetch className="font-medium text-teal-300 underline-offset-4 hover:underline">
              Accesează programul cu telefonul și codul
            </Link>
          </p>
        </div>

        <ul className="mt-12 grid max-w-3xl gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <li
              key={item.label}
              className="rounded-2xl border border-white/10 bg-[#0c1615]/55 px-4 py-3.5 backdrop-blur-sm"
            >
              <p className="text-sm font-semibold text-white">{item.label}</p>
              <p className="mt-1 text-xs leading-relaxed text-teal-100/70">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
