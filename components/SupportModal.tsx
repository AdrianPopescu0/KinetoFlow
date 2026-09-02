"use client"

import { useRef, useState, useTransition } from "react"
import { Check, Copy, Loader2, X } from "lucide-react"

import { submitSupportTicket } from "@/app/support/actions"
import { Dialog, DialogClose, DialogDescription, DialogPopup, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"

export const SUPPORT_EMAIL = "contact@kinetoflow.ro"

type SupportModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SupportModal({ open, onOpenChange }: SupportModalProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleOpenChange(next: boolean) {
    onOpenChange(next)
    if (!next) {
      setError(null)
      setCopied(false)
    }
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await submitSupportTicket(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      formRef.current?.reset()
      onOpenChange(false)
      toast("Mesajul a fost trimis! Te vom contacta în curând.", 4200)
    })
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogPopup>
        <DialogClose
          disabled={isPending}
          className="absolute top-3.5 right-3.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Închide"
        >
          <X className="size-4" />
        </DialogClose>

        <DialogTitle>Ai nevoie de ajutor?</DialogTitle>
        <DialogDescription className="mt-1.5">
          Trimite-ne un mesaj și echipa KinetoFlow îți va răspunde în cel mai scurt timp.
        </DialogDescription>

        <form ref={formRef} action={handleSubmit} className="mt-5 flex flex-col gap-3.5">
          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="support-name">Nume</Label>
            <Input
              id="support-name"
              name="name"
              required
              minLength={2}
              maxLength={120}
              autoComplete="name"
              disabled={isPending}
              placeholder="Numele tău"
              className="h-11 min-h-11"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="support-contact">Email sau Telefon</Label>
            <Input
              id="support-contact"
              name="contact"
              required
              maxLength={160}
              autoComplete="email"
              disabled={isPending}
              placeholder="nume@clinica.ro sau 07xx xxx xxx"
              className="h-11 min-h-11"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="support-message">Mesaj</Label>
            <Textarea
              id="support-message"
              name="message"
              required
              minLength={10}
              maxLength={4000}
              disabled={isPending}
              rows={4}
              placeholder="Cu ce te putem ajuta?"
              className="min-h-24"
            />
          </div>

          <Button type="submit" disabled={isPending} className="mt-1 h-11 min-h-[44px] w-full rounded-xl font-semibold">
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se trimite…
              </>
            ) : (
              "Trimite mesajul"
            )}
          </Button>
        </form>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-muted-foreground">
          <span>Sau scrie-ne direct pe</span>
          <button
            type="button"
            onClick={copyEmail}
            className="inline-flex items-center gap-1 font-medium text-[#042f2e] underline-offset-4 hover:underline"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copiat!" : SUPPORT_EMAIL}
          </button>
        </p>
      </DialogPopup>
    </Dialog>
  )
}
