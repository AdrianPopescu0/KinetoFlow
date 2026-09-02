import type { Metadata } from "next"
import Link from "next/link"

import { RegisterForm } from "@/app/register/register-form"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"

export const metadata: Metadata = {
  title: "Înregistrare | KinetoFlow",
  description: "Creează un cont de clinică sau cabinet în KinetoFlow.",
}

export default function RegisterPage() {
  return (
    <AuthSplitLayout
      title="Creează cont"
      description="Pentru proprietarul clinicii sau kinetoterapeut. După autentificare configurezi cabinetul în un minut."
      footer={
        <>
          <p className="mt-6 text-center text-sm text-slate-600">
            Ai deja cont?{" "}
            <Link href="/login" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
              Autentifică-te
            </Link>
          </p>
          <p className="mt-3 text-center text-sm text-slate-600">
            Ești pacient?{" "}
            <Link href="/acces" className="font-medium text-[#042f2e] underline-offset-4 hover:underline">
              Intră cu telefonul și codul de 8 cifre
            </Link>
          </p>
        </>
      }
    >
      <RegisterForm />
    </AuthSplitLayout>
  )
}
