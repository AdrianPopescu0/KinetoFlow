export default function ClinicArchiveLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8" aria-busy="true">
      <p className="sr-only">Se încarcă arhiva clinicii…</p>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-4 w-80 animate-pulse rounded bg-slate-100" />
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
    </main>
  )
}
