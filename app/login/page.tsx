import type { Metadata } from "next"

import { LoginForm } from "@/app/login/login-form"
import { RecoverSessionRedirect } from "@/components/auth/recover-session-redirect"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"
import { EMAIL_CONFIRM_REQUIRED } from "@/lib/auth/email-confirmed"
import { isSignupAuthMode } from "@/lib/auth/paths"

export const metadata: Metadata = {
  title: "Autentificare | KinetoFlow",
  description: "Intră în cont sau înregistrează o clinică nouă în KinetoFlow.",
}

type LoginPageProps = {
  searchParams: Promise<{ mode?: string; tab?: string; reason?: string; signedout?: string }>
}

function loginReasonMessage(reason: string | undefined): string | null {
  if (reason === "otp_expired") {
    return "Linkul de invitație a expirat sau a fost deja folosit. Cere administratorului un link nou."
  }
  if (reason === "otp_invalid") {
    return "Linkul de autentificare este invalid sau a expirat. Cere un cod nou din formular."
  }
  if (reason === "oauth") {
    return "Autentificarea cu Google a fost anulată sau a eșuat. Încearcă din nou."
  }
  return null
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const signup = isSignupAuthMode(params)

  return (
    <AuthSplitLayout
      title={signup ? "Înregistrează clinică nouă" : "Autentificare"}
      description={
        signup
          ? "Creează contul de administrator al clinicii tale."
          : "Intră în contul tău de terapeut sau administrator."
      }
      footer={
        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          Accesul este rezervat terapeuților și administratorilor KinetoFlow. Nu partaja
          parola și închide sesiunea pe dispozitive partajate.
        </p>
      }
    >
      <RecoverSessionRedirect stayOnPage={params.signedout === "1"} />
      <LoginForm
        initialTab={signup ? "register" : "login"}
        initialError={loginReasonMessage(params.reason)}
        initialInfo={
          params.reason === "confirm_email"
            ? EMAIL_CONFIRM_REQUIRED
            : params.reason === "otp_ok"
              ? "Adresa a fost confirmată din email. Introdu parola și apasă Intră în cont."
              : null
        }
        initialOtpVerified={params.reason === "otp_ok"}
      />
    </AuthSplitLayout>
  )
}
