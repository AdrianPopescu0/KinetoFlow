import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LANDING_FAQ } from "@/lib/landing/faq"

export function LandingFaq() {
  return (
    <section id="intrebari-frecvente" className="px-4 pb-20 sm:px-6 sm:pb-24">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#042f2e] uppercase dark:text-teal-300">FAQ</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Întrebări frecvente
          </h2>
        </div>
        <Accordion className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#14201f]">
          {LANDING_FAQ.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="border-slate-200 px-4 last:border-b-0 sm:px-5 dark:border-white/10"
            >
              <AccordionTrigger className="min-h-12 py-4 text-base font-semibold text-slate-900 hover:no-underline hover:text-[#042f2e] dark:text-white dark:hover:text-teal-200">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-teal-100/70">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
