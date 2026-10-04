import type { Metadata } from "next"

import { redirect } from "next/navigation"

import { EmailOtpForm } from "@/app/auth/email-cod/email-otp-form"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { normalizeAuthEmail, parseAuthEmailOtpPurpose } from "@/lib/auth/email-otp"
import { loginHref } from "@/lib/auth/paths"

export const metadata: Metadata = {
  title: "Cod de confirmare | KinetoFlow",
  description: "Introdu codul de 6 cifre primit pe email pentru a finaliza autentificarea.",
}

type EmailOtpPageProps = {
  searchParams: Promise<{ email?: string; purpose?: string; token?: string }>
}

export default async function EmailOtpPage({ searchParams }: EmailOtpPageProps) {
  const params = await searchParams
  const purpose = parseAuthEmailOtpPurpose(params.purpose)
  const email = normalizeAuthEmail(params.email ?? "") ?? ""
  const hadLegacyLink = Boolean(params.token?.trim())

  if (!email) {
    redirect(loginHref(purpose === "register" ? "signup" : "signin"))
  }

  return (
    <AuthSplitLayout
      title={purpose === "register" ? "Confirmă crearea contului" : "Confirmă autentificarea"}
      description="Tastează manual codul de 6 cifre primit pe email. Linkul din inbox nu te autentifică automat."
      footer={
        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          Dacă ai deschis emailul pe alt dispozitiv, lasă acest ecran deschis aici și copiază doar cifrele.
        </p>
      }
    >
      {hadLegacyLink ? (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950">
          Linkul din email nu confirmă automat contul. Introdu codul de 6 cifre pe dispozitivul de pe care ai
          început.
        </p>
      ) : null}
      <EmailOtpForm email={email} purpose={purpose} />
    </AuthSplitLayout>
  )
}
