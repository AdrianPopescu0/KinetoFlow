import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { LANDING_FAQ } from "@/lib/landing/faq"

export function LandingFaq() {
  return (
    <section id="intrebari-frecvente" className="px-4 pb-16 sm:px-6 sm:pb-20">
      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Întrebări frecvente
          </h2>
        </div>
        <Accordion className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {LANDING_FAQ.map((item) => (
            <AccordionItem
              key={item.question}
              value={item.question}
              className="border-slate-200 px-4 last:border-b-0 sm:px-5"
            >
              <AccordionTrigger className="min-h-12 py-4 text-base font-semibold text-slate-900 hover:no-underline">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="pb-4 text-sm leading-relaxed text-slate-600 sm:text-base">
                <p>{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
