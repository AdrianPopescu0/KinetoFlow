import type { Metadata } from "next"

import { EmailOtpForm } from "@/app/auth/email-cod/email-otp-form"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { normalizeAuthEmail, parseAuthEmailOtpPurpose } from "@/lib/auth/email-otp"

export const metadata: Metadata = {
  title: "Confirmă adresa | KinetoFlow",
  description: "Introdu codul de 6 cifre primit pe email pentru a confirma contul.",
}

type EmailOtpPageProps = {
  searchParams: Promise<{ email?: string; purpose?: string; token?: string }>
}

export default async function EmailOtpPage({ searchParams }: EmailOtpPageProps) {
  const params = await searchParams
  const email = normalizeAuthEmail(params.email ?? "") ?? ""
  const purpose = parseAuthEmailOtpPurpose(params.purpose)
  const hadLegacyLink = Boolean(params.token?.trim())

  return (
    <AuthSplitLayout
      title="Confirmă adresa de email"
      description="Tastează manual codul de 6 cifre. Nu te autentificăm din linkul din inbox."
      footer={
        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          Dacă ai deschis emailul pe alt dispozitiv, lasă acest ecran deschis aici și copiază doar cifrele.
        </p>
      }
    >
      {hadLegacyLink ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          Linkul din email nu mai confirmă automat contul. Introdu codul de 6 cifre pe dispozitivul de pe care ai
          început înregistrarea.
        </p>
      ) : null}
      {email ? (
        <EmailOtpForm email={email} purpose={purpose} />
      ) : (
        <p className="text-sm text-slate-600">
          Lipsește adresa de email. Revino la înregistrare sau autentificare și cere un cod nou.
        </p>
      )}
    </AuthSplitLayout>
  )
}
