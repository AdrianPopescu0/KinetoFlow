import type { Metadata } from "next"
import { Suspense } from "react"

import { ProtocolsData } from "@/app/dashboard/protocols/protocols-data"

export const metadata: Metadata = {
  title: "Bibliotecă Protocoale | KinetoFlow",
}

function ProtocolsSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-72 rounded-lg bg-slate-200" />
      <div className="h-4 w-full max-w-xl rounded bg-slate-200" />
      <div className="mt-6 h-12 rounded-xl bg-slate-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-40 rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
        <div className="h-40 rounded-2xl bg-slate-200" />
      </div>
      <p className="sr-only">Se încarcă biblioteca de protocoale…</p>
    </div>
  )
}

export default function ProtocolsPage() {
  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-hidden px-5 py-8">
      <Suspense fallback={<ProtocolsSkeleton />}>
        <ProtocolsData />
      </Suspense>
    </main>
  )
}
