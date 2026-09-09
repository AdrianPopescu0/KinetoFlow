import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { EarlyAccessWelcomeForm } from "@/app/early-access/cont/welcome-form"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { hasValidEarlyAccessCookie, EARLY_ACCESS_COOKIE } from "@/lib/auth/early-access"
import { readVerifiedEmailCookie } from "@/lib/auth/email-otp"
import { VERIFIED_OTP_COOKIE } from "@/lib/auth/email-otp-issue"

export const metadata = {
  title: "Email terapeut — KinetoFlow",
  description: "Introdu adresa de email ca să primești un cod de acces și să îți creezi sau asociezi contul.",
}

type ContinuePageProps = {
  searchParams: Promise<{ reason?: string }>
}

export default async function EarlyAccessContinuePage({ searchParams }: ContinuePageProps) {
  const jar = await cookies()
  if (!(await hasValidEarlyAccessCookie(jar.get(EARLY_ACCESS_COOKIE)?.value))) {
    redirect("/early-access")
  }

  const params = await searchParams
  const verifiedEmail = readVerifiedEmailCookie(jar.get(VERIFIED_OTP_COOKIE)?.value)

  return (
    <AuthSplitLayout
      title="Emailul tău de terapeut"
      description="Nu ești obligat să folosești Google. Introdu adresa personală, confirm-o cu codul din inbox, apoi creează sau asociază contul KinetoFlow."
      footer={
        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          Folosim aceeași autentificare Supabase ca în restul aplicației: parolă, OTP pe email și,
          opțional, Google.
        </p>
      }
    >
      <EarlyAccessWelcomeForm
        initialEmail={verifiedEmail ?? ""}
        initialVerified={Boolean(verifiedEmail) || params.reason === "otp_ok"}
        initialError={
          params.reason === "otp_invalid"
            ? "Linkul de autentificare este invalid sau a expirat. Cere un cod nou din formular."
            : null
        }
        initialInfo={
          verifiedEmail || params.reason === "otp_ok"
            ? "Adresa a fost confirmată din email. Introdu parola ca să intri sau să creezi contul."
            : null
        }
      />
    </AuthSplitLayout>
  )
}
