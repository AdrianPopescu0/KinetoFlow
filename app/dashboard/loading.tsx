import { DashboardOverviewSkeleton } from "@/components/dashboard/dashboard-skeleton"

export default function DashboardLoading() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-8">
      <div className="flex flex-col gap-2">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-4 w-80 animate-pulse rounded bg-slate-100" />
      </div>
      <DashboardOverviewSkeleton />
    </main>
  )
}
