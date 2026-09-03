import type { Metadata } from "next"
import Link from "next/link"

import { SET_PASSWORD_PATH } from "@/lib/auth/paths"
import { AppShell, surfaceCardClassName } from "@/components/brand/app-atmosphere"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"

export const metadata: Metadata = {
  title: "Activează accesul | KinetoFlow",
  description: "Confirmă invitația în echipa clinicii și setează-ți parola.",
}

type ActivarePageProps = {
  searchParams: Promise<{ token_hash?: string; type?: string }>
}

export default async function ActivarePage({ searchParams }: ActivarePageProps) {
  const params = await searchParams
  const tokenHash = typeof params.token_hash === "string" ? params.token_hash.trim() : ""
  const type = params.type === "magiclink" ? "magiclink" : "recovery"

  return (
    <AppShell>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className={surfaceCardClassName("w-full max-w-md p-6 sm:p-8")}>
          <Logo size="md" />
          <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-800">
            Activează-ți accesul
          </h1>
          {tokenHash ? (
            <>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                Ai fost adăugat în echipa clinicii pe KinetoFlow. Apasă butonul de mai jos pentru a
                confirma invitația și a-ți alege parola. Linkul e de unică folosință.
              </p>
              <form action="/auth/callback" method="get">
                <input type="hidden" name="token_hash" value={tokenHash} />
                <input type="hidden" name="type" value={type} />
                <input type="hidden" name="next" value={SET_PASSWORD_PATH} />
                <Button type="submit" className="h-12 min-h-[48px] w-full rounded-xl font-semibold">
                  Confirmă invitația
                </Button>
              </form>
            </>
          ) : (
            <>
              <p className="mt-2 mb-6 text-sm leading-relaxed text-slate-600">
                Linkul de invitație lipsește sau este incomplet. Cere administratorului un link nou
                pe WhatsApp.
              </p>
              <Link
                href="/login"
                className="inline-flex h-12 min-h-[48px] w-full items-center justify-center rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-800"
              >
                Mergi la autentificare
              </Link>
            </>
          )}
        </div>
      </main>
    </AppShell>
  )
}
