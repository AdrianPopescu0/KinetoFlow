"use client"

import { useState, useTransition } from "react"

import { signInWithGoogle } from "@/app/login/actions"
import { Button } from "@/components/ui/button"

export function GoogleAuthButton({ label }: { label: string }) {
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClick() {
    setError(null)
    startTransition(async () => {
      const result = await signInWithGoogle()
      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={isPending}
        onClick={handleClick}
        className="h-12 min-h-[48px] w-full rounded-xl border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
      >
        <GoogleMark />
        {isPending ? "Se deschide Google…" : label}
      </Button>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.82-.07-1.64-.23-2.43H12v4.6h6.46a5.52 5.52 0 0 1-2.4 3.63v3h3.87c2.27-2.09 3.56-5.17 3.56-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.97-1.07 7.96-2.93l-3.87-3c-1.08.72-2.47 1.14-4.09 1.14-3.14 0-5.8-2.12-6.76-4.96H1.24v3.09A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.24 14.25A7.2 7.2 0 0 1 4.86 12c0-.78.13-1.53.36-2.25V6.66H1.24A12 12 0 0 0 0 12c0 1.94.46 3.77 1.24 5.34l4-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43C17.96 1.19 15.23 0 12 0 7.31 0 3.26 2.69 1.24 6.66l4 3.09C6.2 6.87 8.86 4.75 12 4.75Z"
      />
    </svg>
  )
}
