export default function ExercisesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-5 py-8">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    </div>
  )
}
