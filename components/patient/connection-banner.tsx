import { Wifi, WifiOff } from "lucide-react"

import { OFFLINE_BANNER_MESSAGE, ONLINE_AGAIN_MESSAGE } from "@/lib/patients/ux-copy"

export function ConnectionBanner({
  online,
  justReconnected,
}: {
  online: boolean
  justReconnected: boolean
}) {
  if (online && !justReconnected) {
    return null
  }

  if (justReconnected) {
    return (
      <div
        role="status"
        className="border-b border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100"
      >
        <p className="mx-auto flex max-w-7xl items-start gap-2 sm:px-2">
          <Wifi className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{ONLINE_AGAIN_MESSAGE}</span>
        </p>
      </div>
    )
  }

  return (
    <div
      role="status"
      className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <p className="mx-auto flex max-w-7xl items-start gap-2 sm:px-2">
        <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        <span>{OFFLINE_BANNER_MESSAGE}</span>
      </p>
    </div>
  )
}
