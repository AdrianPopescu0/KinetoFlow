export default function SettingsLoading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8" aria-busy="true">
      <p className="sr-only">Se încarcă setările…</p>
      <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
      <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
      <div className="h-80 animate-pulse rounded-2xl bg-slate-200" />
    </main>
  )
}
