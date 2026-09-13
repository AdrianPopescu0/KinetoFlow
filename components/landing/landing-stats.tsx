import { LANDING_STATS } from "@/lib/landing/stats"

export function LandingStats() {
  return (
    <section id="cifre" aria-label="Cifre cheie" className="px-4 pb-8 sm:px-6 sm:pb-10">
      <div className="mx-auto w-full max-w-6xl">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {LANDING_STATS.map((stat) => (
            <li
              key={stat.label}
              className="rounded-2xl border border-white/10 bg-[#14201f] px-4 py-6 text-center sm:px-5 sm:py-8"
            >
              <p className="text-4xl font-semibold tabular-nums tracking-tight text-teal-300 sm:text-5xl">
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-medium leading-snug text-teal-100/70 sm:text-sm">{stat.label}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
