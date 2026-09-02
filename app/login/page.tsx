import type { Metadata } from "next"
import Link from "next/link"

import { LoginForm } from "@/app/login/login-form"
import { AuthSplitLayout } from "@/components/auth/auth-split-layout"

export const metadata: Metadata = {
  title: "Autentificare | KinetoFlow",
  description: "Intră în cont sau înregistrează o clinică nouă în KinetoFlow.",
}

type LoginPageProps = {
  searchParams: Promise<{ tab?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { tab } = await searchParams
  const initialTab = tab === "register" ? "register" : "login"

  return (
    <AuthSplitLayout
      title="Cont clinică"
      description="Intră în contul existent sau înregistrează un cabinet nou. După înregistrare configurezi clinica în un minut."
      footer={
        <>
          <p className="mt-6 text-center text-sm text-slate-600">
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
      <LoginForm initialTab={initialTab} />
    </AuthSplitLayout>
  )
}
