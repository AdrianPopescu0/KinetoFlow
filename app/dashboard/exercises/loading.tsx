export default function ExercisesLoading() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="h-10 w-64 animate-pulse rounded-xl bg-slate-200" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="h-80 w-full animate-pulse rounded-2xl bg-slate-200 lg:w-[260px]" />
        <div className="min-w-0 flex-1">
          <div className="h-12 w-full animate-pulse rounded-xl bg-slate-200" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
