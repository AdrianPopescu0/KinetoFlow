"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronRight, HelpCircle, Languages, LogIn, Mail, Settings, Smartphone, X } from "lucide-react"

import { useLandingLocale } from "@/components/landing/landing-locale"
import { SupportModal, SUPPORT_EMAIL } from "@/components/SupportModal"
import { ThemePreferenceSection } from "@/components/theme/dashboard-theme"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { AppLocale } from "@/lib/i18n/locale"

const COPY: Record<
  AppLocale,
  {
    eyebrow: string
    title: string
    description: string
    language: string
    languageHelp: string
    romanian: string
    english: string
    contact: string
    contactHelp: string
    support: string
    login: string
    patient: string
    faq: string
    settings: string
  }
> = {
  ro: {
    eyebrow: "Pagină de prezentare",
    title: "Setări",
    description: "Alege tema, limba și scurtăturile de contact pentru vizita pe KinetoFlow.",
    language: "Limba",
    languageHelp: "Interfața de setări și meniul din antet urmează limba aleasă. Conținutul clinic rămâne în română.",
    romanian: "Română",
    english: "English",
    contact: "Contact și suport",
    contactHelp: "Scrie-ne sau treci direct la autentificare, acces pacient și întrebări frecvente.",
    support: "Trimite un mesaj de suport",
    login: "Autentificare clinică",
    patient: "Acces pacient",
    faq: "Întrebări frecvente",
    settings: "Setări",
  },
  en: {
    eyebrow: "Marketing site",
    title: "Settings",
    description: "Choose theme, language, and quick contact shortcuts for your visit to KinetoFlow.",
    language: "Language",
    languageHelp: "The settings panel and header follow your choice. Clinical content stays in Romanian.",
    romanian: "Romanian",
    english: "English",
    contact: "Contact and support",
    contactHelp: "Message us, or jump to clinic login, patient access, and frequently asked questions.",
    support: "Send a support message",
    login: "Clinic sign in",
    patient: "Patient access",
    faq: "Frequently asked questions",
    settings: "Settings",
  },
}

function LandingSettingsPanel() {
  const [open, setOpen] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const { locale, setLocale } = useLandingLocale()
  const copy = COPY[locale]

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={copy.settings}
        className={cn(
          "inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium transition-colors",
          "bg-slate-900/5 text-slate-800 hover:bg-slate-900/10",
          "dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
        )}
      >
        <Settings className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">{copy.settings}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogPopup className="max-h-[min(90vh,42rem)] overflow-y-auto dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]">
          <DialogClose
            className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-[var(--kf-raised)] dark:hover:text-[var(--kf-text)]"
            aria-label={locale === "en" ? "Close" : "Închide"}
          >
            <X className="size-4" />
          </DialogClose>

          <p className="text-xs font-semibold tracking-wide text-[#042f2e] uppercase dark:text-teal-300">
            {copy.eyebrow}
          </p>
          <DialogTitle className="mt-1 dark:text-[var(--kf-text)]">{copy.title}</DialogTitle>
          <DialogDescription className="mt-1.5 dark:text-[var(--kf-text-muted)]">
            {copy.description}
          </DialogDescription>

          <div className="mt-5">
            <ThemePreferenceSection
              standalone
              description={
                locale === "en"
                  ? "Switch light and dark instantly, or follow this device."
                  : "Comută imediat între luminos și întuneric sau lasă tema să urmeze dispozitivul."
              }
            />
          </div>

          <section className="mt-6 flex flex-col gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-[var(--kf-text)]">
                <Languages className="size-4" aria-hidden="true" />
                {copy.language}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">{copy.languageHelp}</p>
            </div>
            <div role="radiogroup" aria-label={copy.language} className="grid grid-cols-2 gap-2">
              {(["ro", "en"] as const).map((value) => {
                const selected = locale === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setLocale(value)}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition-colors",
                      selected
                        ? "border-[#042f2e] bg-teal-50 text-slate-900 ring-1 ring-[#042f2e] dark:border-teal-400 dark:bg-[#1f2e2c] dark:text-[var(--kf-text)] dark:ring-teal-400"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)] dark:text-[var(--kf-text)] dark:hover:bg-[var(--kf-raised)]",
                    )}
                  >
                    {value === "ro" ? copy.romanian : copy.english}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mt-6 flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-[var(--kf-text)]">{copy.contact}</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-[var(--kf-text-muted)]">{copy.contactHelp}</p>
            </div>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:hover:bg-[var(--kf-surface)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <Mail className="size-4 shrink-0 text-[#042f2e] dark:text-teal-300" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">
                    {SUPPORT_EMAIL}
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-600 dark:text-[var(--kf-text-muted)]">
                    KinetoFlow
                  </span>
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setSupportOpen(true)
              }}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:hover:bg-[var(--kf-surface)]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <HelpCircle className="size-4 shrink-0 text-[#042f2e] dark:text-teal-300" aria-hidden="true" />
                <span className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">{copy.support}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
            </button>
            <Shortcut href="/login" icon={LogIn} label={copy.login} onNavigate={() => setOpen(false)} />
            <Shortcut href="/acces" icon={Smartphone} label={copy.patient} onNavigate={() => setOpen(false)} />
            <Shortcut href="#intrebari-frecvente" icon={HelpCircle} label={copy.faq} onNavigate={() => setOpen(false)} />
          </section>
        </DialogPopup>
      </Dialog>
      <SupportModal open={supportOpen} onOpenChange={setSupportOpen} />
    </>
  )
}

function Shortcut({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string
  icon: typeof LogIn
  label: string
  onNavigate: () => void
}) {
  return (
    <Link
      href={href}
      prefetch={href.startsWith("/")}
      onClick={onNavigate}
      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100 dark:border-[var(--kf-border)] dark:bg-[var(--kf-raised)] dark:hover:bg-[var(--kf-surface)]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="size-4 shrink-0 text-[#042f2e] dark:text-teal-300" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-800 dark:text-[var(--kf-text)]">{label}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
    </Link>
  )
}

export function LandingSettingsButton() {
  return <LandingSettingsPanel />
}
