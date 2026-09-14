import { LANDING_ABOUT } from "@/lib/landing/about"

export function LandingAbout() {
  return (
    <section id="despre" className="px-4 py-16 sm:px-6 sm:py-20">
      <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white px-6 py-10 sm:px-10 sm:py-12 dark:border-white/10 dark:bg-[#14201f]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_0%,rgba(45,212,191,0.12),transparent_46%)]"
        />
        <div className="relative text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#042f2e] uppercase dark:text-teal-300">
            {LANDING_ABOUT.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {LANDING_ABOUT.title}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-pretty text-slate-600 sm:text-lg dark:text-teal-100/75">
            {LANDING_ABOUT.paragraph}
          </p>
        </div>
      </div>
    </section>
  )
}
