"use client"

import { useSyncExternalStore } from "react"

type Toast = { id: number; message: string }

let toasts: Toast[] = []
let nextId = 1
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach((listener) => listener())
}

export function toast(message: string, durationMs = 2400) {
  const id = nextId++
  toasts = [...toasts, { id, message }]
  emit()
  window.setTimeout(() => {
    toasts = toasts.filter((item) => item.id !== id)
    emit()
  }, durationMs)
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

const EMPTY_TOASTS: Toast[] = []

export function Toaster() {
  const items = useSyncExternalStore(
    subscribe,
    () => toasts,
    () => EMPTY_TOASTS,
  )

  if (items.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(100%-2rem,22rem)] flex-col gap-2">
      {items.map((item) => (
        <p
          key={item.id}
          className="rounded-xl border border-teal-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-lg"
          role="status"
        >
          {item.message}
        </p>
      ))}
    </div>
  )
}
