export default function PatientLoading() {
  return (
    <div className="relative min-h-full bg-emerald-950">
      <div className="absolute inset-0 bg-[linear-gradient(160deg,#064e3b_0%,#042f2e_48%,#022c22_100%)]" />
      <div className="relative">
        <div className="h-48 animate-pulse border-b border-white/10 bg-white/5" />
        <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
          <div className="h-64 animate-pulse rounded-2xl border border-white/10 bg-white/5" />
        </div>
      </div>
    </div>
  )
}
