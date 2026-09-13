export function ExercisesLibrarySkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <p className="sr-only">Se încarcă biblioteca de exerciții…</p>
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="flex gap-2">
        <div className="h-10 w-28 animate-pulse rounded-full bg-slate-200" />
        <div className="h-10 w-36 animate-pulse rounded-full bg-slate-200" />
        <div className="h-10 w-32 animate-pulse rounded-full bg-slate-200" />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  )
}
