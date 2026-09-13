export default function TeamLoading() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-5 py-8" aria-busy="true">
      <p className="sr-only">Se încarcă echipa…</p>
      <div className="h-8 w-52 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
    </main>
  )
}
