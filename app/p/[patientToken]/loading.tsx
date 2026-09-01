export default function PatientLoading() {
  return (
    <div className="min-h-full bg-slate-50">
      <div className="h-48 animate-pulse bg-[#042f2e]" />
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
        <div className="h-64 animate-pulse rounded-2xl border border-slate-200 bg-white shadow-sm" />
      </div>
    </div>
  )
}
