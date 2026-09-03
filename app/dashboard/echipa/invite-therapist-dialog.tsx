"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus, UserPlus } from "lucide-react"

import { inviteTherapistAction } from "@/app/dashboard/echipa/actions"
import { isForbiddenError } from "@/lib/http/forbidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

export function InviteTherapistDialog({
  triggerLabel = "Adaugă Terapeut",
  triggerClassName,
}: {
  triggerLabel?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function close() {
    if (isPending) {
      return
    }
    setOpen(false)
    setError(null)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await inviteTherapistAction(formData)
        if (result.status === 403) {
          setError(result.error ?? "Nu ai permisiunea de a invita terapeuți.")
          return
        }
        if (result.error || !result.ok) {
          setError(result.error ?? "Nu am putut trimite invitația.")
          return
        }
        toast(`Invitația a fost trimisă la ${result.invitedEmail}.`)
        setOpen(false)
      } catch (caught) {
        if (isForbiddenError(caught) || (caught instanceof Error && caught.message.includes("administrator"))) {
          setError(caught instanceof Error ? caught.message : "Acces interzis (403).")
          return
        }
        const digest = caught instanceof Error ? caught.message : "Nu am putut trimite invitația."
        setError(digest)
      }
    })
  }

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)} className={cn("h-11 rounded-xl", triggerClassName)}>
        <Plus className="size-4" />
        {triggerLabel}
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Închide" onClick={close} />
          <form
            action={handleSubmit}
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
                <UserPlus className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Adaugă terapeut</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Trimitem un email de invitație. Colegul își setează parola și intră în același cabinet.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-therapist_name">Nume terapeut</Label>
                <Input id="invite-therapist_name" name="therapist_name" required className="h-11" placeholder="Elena Ionescu" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input id="invite-email" name="email" type="email" required className="h-11" placeholder="elena@clinica.ro" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="invite-phone">Telefon (opțional)</Label>
                <Input id="invite-phone" name="phone" type="tel" className="h-11" placeholder="07xx xxx xxx" />
              </div>
              {error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={close} className="h-11 rounded-xl">
                  Anulează
                </Button>
                <Button type="submit" disabled={isPending} className="h-11 rounded-xl">
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se trimite…
                    </>
                  ) : (
                    "Trimite invitația"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}
