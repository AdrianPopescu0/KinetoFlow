import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/app/login/login-form"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"

export const metadata: Metadata = {
  title: "Autentificare | KinetoFlow",
  description: "Autentifică-te în KinetoFlow pentru a gestiona programele de kinetoterapie.",
}

export default function LoginPage() {
  return (
    <AuthSplitLayout
      title="Autentificare"
      description="Continuă cu Google sau cu emailul de serviciu al clinicii."
      footer={
        <>
          <p className="mt-6 text-center text-sm text-slate-600">
            Nu ai cont?{" "}
            <Link href="/register" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
              Creează un cont de clinică
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-slate-600">
            Ești pacient?{" "}
            <Link href="/acces" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
              Intră cu telefonul și codul de 8 cifre
            </Link>
          </p>
          <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
            Accesul este rezervat terapeuților și administratorilor KinetoFlow. Nu partaja
            parola și închide sesiunea pe dispozitive partajate.
          </p>
        </>
      }
    >
      <LoginForm />
    </AuthSplitLayout>
  )
}
