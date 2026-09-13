import Image from "next/image"

import {
  LANDING_STATS,
  LANDING_STATS_EYEBROW,
  LANDING_STATS_LEAD,
  LANDING_STATS_TITLE,
} from "@/lib/landing/stats"

export function LandingStats() {
  return (
    <section id="cifre" aria-labelledby="cifre-title" className="border-y border-white/10">
      <div className="grid lg:grid-cols-2">
        <div className="relative h-full min-h-[18rem] overflow-hidden sm:min-h-[24rem] lg:min-h-[28rem]">
          <Image
            src="/landing/stats-recovery.jpg"
            alt="Terapeut care evaluează spatele unui pacient în timpul unei ședințe de kinetoterapie"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover object-[50%_30%]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,47,46,0.18),rgba(12,22,21,0.28))] lg:bg-[linear-gradient(90deg,transparent_55%,rgba(15,36,34,0.35))]"
          />
          <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-teal-400 lg:inset-y-0 lg:right-auto lg:h-auto lg:w-1" />
        </div>

        <div className="flex flex-col justify-center bg-[#0f2422] px-5 py-10 sm:px-10 sm:py-14 lg:px-12">
          <p className="text-xs font-semibold tracking-[0.18em] text-teal-300 uppercase">
            {LANDING_STATS_EYEBROW}
          </p>
          <h2
            id="cifre-title"
            className="mt-3 max-w-md text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            {LANDING_STATS_TITLE}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-teal-100/70 sm:text-base">
            {LANDING_STATS_LEAD}
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-8">
            {LANDING_STATS.map((stat) => (
              <li key={stat.label}>
                <p className="text-4xl font-semibold tabular-nums tracking-tight text-teal-300 sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 text-xs font-medium leading-snug text-teal-100/75 sm:text-sm">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
