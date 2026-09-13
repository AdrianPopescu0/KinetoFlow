"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

export function LogoutConfirmButton({
  label = "Logout",
  confirmLabel = "Da, deconectează-mă",
  pendingLabel = "Ieșire…",
  onConfirm,
  triggerClassName,
  triggerVariant = "outline",
}: {
  label?: string
  confirmLabel?: string
  pendingLabel?: string
  onConfirm: () => void | Promise<void>
  triggerClassName?: string
  triggerVariant?: "outline" | "onDark"
}) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function confirm() {
    startTransition(async () => {
      await onConfirm()
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className={cn(
          triggerVariant === "onDark"
            ? "h-10 rounded-xl border-white/20 bg-white/10 px-3 text-white hover:bg-white/15 hover:text-white"
            : "h-11 min-h-[44px] rounded-xl",
          triggerClassName,
        )}
      >
        {label}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!isPending) {
            setOpen(next)
          }
        }}
      >
        <DialogPopup className="max-w-sm dark:border-[var(--kf-border)] dark:bg-[var(--kf-surface)]">
          <DialogTitle className="dark:text-[var(--kf-text)]">Deconectare</DialogTitle>
          <DialogDescription className="mt-2 dark:text-[var(--kf-text-muted)]">
            Ești sigur că vrei să te deconectezi?
          </DialogDescription>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <DialogClose
              disabled={isPending}
              className={cn(buttonVariants({ variant: "outline" }), "h-11 rounded-xl")}
            >
              Anulează
            </DialogClose>
            <Button
              type="button"
              disabled={isPending}
              onClick={confirm}
              className="h-11 rounded-xl bg-red-700 text-white hover:bg-red-800"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {pendingLabel}
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </div>
        </DialogPopup>
      </Dialog>
    </>
  )
}
