export default function PatientFileLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8" aria-busy="true">
      <p className="sr-only">Se încarcă fișa pacientului…</p>
      <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
      <div className="h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-48 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      <div className="h-56 animate-pulse rounded-2xl bg-slate-200" />
    </main>
  )
}
