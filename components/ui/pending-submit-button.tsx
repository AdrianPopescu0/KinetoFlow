"use client"

import type { ComponentProps } from "react"
import { useFormStatus } from "react-dom"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

type PendingSubmitButtonProps = ComponentProps<typeof Button> & {
  pendingLabel?: string
}

export function PendingSubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus()
  const isBusy = pending || disabled

  return (
    <Button {...props} disabled={isBusy} aria-busy={pending}>
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
