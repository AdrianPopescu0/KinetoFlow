import Image from "next/image"

import {
  LANDING_STATS,
  LANDING_STATS_EYEBROW,
  LANDING_STATS_LEAD,
  LANDING_STATS_TITLE,
} from "@/lib/landing/stats"

export function LandingStats() {
  return (
    <section id="cifre" aria-labelledby="cifre-title" className="bg-[#0c1615]">
      <div className="kf-stats-photo-mask relative isolate min-h-[20rem] overflow-hidden sm:min-h-[26rem] lg:min-h-[32rem]">
        <Image
          src="/landing/stats-recovery.jpg"
          alt="Terapeut care evaluează spatele unui pacient în timpul unei ședințe de kinetoterapie"
          fill
          sizes="100vw"
          className="object-cover object-[50%_28%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,47,46,0.12),rgba(12,22,21,0.08)_55%,transparent_70%)]"
        />
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-teal-400" />
      </div>

      <div className="relative z-10 mx-auto -mt-16 max-w-6xl px-4 pb-12 sm:-mt-20 sm:px-6 sm:pb-16">
        <div className="px-1 sm:px-2">
          <p className="text-xs font-semibold tracking-[0.18em] text-teal-300 uppercase">
            {LANDING_STATS_EYEBROW}
          </p>
          <h2
            id="cifre-title"
            className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl"
          >
            {LANDING_STATS_TITLE}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-teal-100/70 sm:text-base">
            {LANDING_STATS_LEAD}
          </p>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-8 lg:grid-cols-4">
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
