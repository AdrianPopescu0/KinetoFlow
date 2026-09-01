export default function PatientLoading() {
  return (
    <div className="min-h-full bg-[#F3F6F7]">
      <div className="h-48 animate-pulse bg-[#0F4C5C]" />
      <div className="mx-auto flex max-w-lg flex-col gap-4 px-4 py-6">
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
        <div className="h-64 animate-pulse rounded-2xl bg-white" />
      </div>
    </div>
  )
}
