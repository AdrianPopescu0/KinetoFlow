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
    <section className="relative isolate min-h-[calc(100svh-4rem)] overflow-hidden bg-[#0c1615]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/50">
        <div
          role="img"
          aria-label="Terapeut care urmărește un pacient în timpul unui exercițiu de recuperare pe reformer"
          className="absolute inset-0 bg-cover bg-no-repeat bg-[position:68%_40%] sm:bg-[position:78%_42%]"
          style={{ backgroundImage: "url('/landing/hero-recovery.jpg')" }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/50"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(45,212,191,0.14),transparent_42%)]"
        />
        <div className="pointer-events-none absolute inset-0 opacity-80">
          <LandingHeroArt />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent from-[62%] to-[#0c1615]"
      />

      <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-between gap-10 px-4 pt-10 pb-16 sm:px-6 sm:pt-16 sm:pb-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold tracking-tight text-balance text-white sm:text-6xl sm:leading-[1.05]">
            Organizează-ți cabinetul simplu și curat
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-pretty text-teal-50/80 sm:text-lg">
            Un loc simplu unde ții evidența pacienților, a exercițiilor și a programelor de recuperare.
            Fără hârtie, fără bătăi de cap.
          </p>
          <div className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-none sm:flex-row">
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
          <p className="mt-4 text-sm text-teal-100/70">
            Ești pacient?{" "}
            <Link href="/acces" prefetch className="font-medium text-teal-300 underline-offset-4 hover:underline">
              Accesează programul cu telefonul și codul
            </Link>
          </p>
        </div>

        <ul className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {highlights.map((item) => (
            <li
              key={item.label}
              className="flex min-h-[7.5rem] flex-col justify-between rounded-2xl border border-white/12 bg-[#0c1615]/70 px-5 py-4 backdrop-blur-md sm:min-h-[8.5rem] sm:px-5 sm:py-5"
            >
              <p className="text-base font-semibold text-white">{item.label}</p>
              <p className="mt-2 text-sm leading-relaxed text-teal-100/75">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
