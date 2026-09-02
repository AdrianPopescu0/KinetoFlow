import type { ReactNode } from "react"

export function LegalArticle({
  title,
  description,
  updated,
  children,
}: {
  title: string
  description: string
  updated: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:py-14">
      <p className="text-xs font-semibold tracking-wide text-teal-800 uppercase">Document legal</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-600">{description}</p>
      <p className="mt-2 text-xs text-slate-500">Ultima actualizare: {updated}</p>
      <article className="mt-10 flex flex-col gap-8 text-sm leading-relaxed text-slate-700 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
        {children}
      </article>
    </main>
  )
}
