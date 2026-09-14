import Image from "next/image"

import {
  LANDING_STATS,
  LANDING_STATS_EYEBROW,
  LANDING_STATS_LEAD,
  LANDING_STATS_TITLE,
} from "@/lib/landing/stats"

export function LandingStats() {
  return (
    <section id="cifre" aria-labelledby="cifre-title" className="bg-slate-50 dark:bg-[#0c1615]">
      <div className="mx-auto max-w-6xl px-4 pt-4 pb-2 sm:px-6">
        <p className="text-xs font-semibold tracking-[0.18em] text-[#042f2e] uppercase dark:text-teal-300">
          {LANDING_STATS_EYEBROW}
        </p>
        <h2
          id="cifre-title"
          className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white"
        >
          {LANDING_STATS_TITLE}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-teal-100/70">
          {LANDING_STATS_LEAD}
        </p>
      </div>

      <div className="kf-stats-photo-mask relative isolate -mt-2 min-h-[20rem] overflow-hidden sm:min-h-[26rem] lg:min-h-[34rem]">
        <Image
          src="/landing/stats-recovery.jpg"
          alt="Terapeut care evaluează spatele unui pacient în timpul unei ședințe de kinetoterapie"
          fill
          sizes="100vw"
          className="object-cover object-[50%_28%]"
        />
      </div>

      <div className="relative z-10 mx-auto -mt-14 max-w-6xl px-4 pb-12 sm:-mt-16 sm:px-6 sm:pb-16">
        <ul className="grid grid-cols-2 gap-x-4 gap-y-7 sm:gap-x-8 lg:grid-cols-4">
          {LANDING_STATS.map((stat) => (
            <li key={stat.label}>
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-teal-300 sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-1.5 text-xs font-medium leading-snug text-slate-600 sm:text-sm dark:text-teal-100/75">
                {stat.label}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
