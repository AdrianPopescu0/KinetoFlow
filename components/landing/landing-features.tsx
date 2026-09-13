import {
  Bell,
  ClipboardList,
  Library,
  LineChart,
  ShieldCheck,
  Users,
} from "lucide-react"

const features = [
  {
    title: "Pacienți și fișe într-un singur loc",
    description:
      "Adaugi pacienți, ții diagnosticul și notele clinice la îndemână și asignezi terapeutul responsabil.",
    icon: ClipboardList,
  },
  {
    title: "Programe de recuperare clare",
    description:
      "Construiești planul zilnic din biblioteca de exerciții: seturi, repetări, video și perioada de tratament.",
    icon: Library,
  },
  {
    title: "Progres vizibil, nu ghicit",
    description:
      "Check-in-ul de durere (VAS), frecvența reală și durata ședinței arată dacă programul e urmat.",
    icon: LineChart,
  },
  {
    title: "Invitații și reminder-e fără haos",
    description:
      "Trimiți accesul pe WhatsApp sau SMS. Reminder-ele de check-in ajung automat, prin notificări push.",
    icon: Bell,
  },
  {
    title: "Echipa clinicii, nu doar un cont",
    description:
      "Administratorul invită terapeuți în același cabinet. Fiecare își vede pacienții, toți văd fluxul cabinetului.",
    icon: Users,
  },
  {
    title: "Acces securizat, pe roluri",
    description:
      "Terapeuții se autentifică în cont. Pacienții intră cu telefon și cod unic, fără parole greoaie.",
    icon: ShieldCheck,
  },
]

export function LandingFeatures() {
  return (
    <section id="beneficii" className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold tracking-[0.18em] text-teal-300 uppercase">Beneficii</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Tot ce trebuie ca să ții activitatea sub control
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-teal-100/70 sm:text-base">
            De la primul pacient până la check-in-ul de seară: mai puțină administrare, mai multă
            atenție pe recuperare.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <li
                key={feature.title}
                className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#14201f] p-5 shadow-[0_20px_50px_-28px_rgba(4,47,46,0.9)] sm:p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-teal-400/12 text-teal-300">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-semibold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-teal-100/70">{feature.description}</p>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
