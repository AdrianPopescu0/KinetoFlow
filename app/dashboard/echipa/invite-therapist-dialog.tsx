"use client"

import { useState, useTransition } from "react"
import { Check, Copy, Loader2, MessageCircle, Plus, UserPlus } from "lucide-react"

import { inviteTherapistAction } from "@/app/dashboard/echipa/actions"
import { isForbiddenError } from "@/lib/http/forbidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

type InviteReady = {
  therapistName: string
  inviteLink: string
  whatsappHref: string | null
}

export function InviteTherapistDialog({
  triggerLabel = "Adaugă Terapeut",
  triggerClassName,
}: {
  triggerLabel?: string
  triggerClassName?: string
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState<InviteReady | null>(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function close() {
    if (isPending) {
      return
    }
    setOpen(false)
    setError(null)
    setReady(null)
    setCopied(false)
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
        if (result.error || !result.ok || !result.inviteLink || !result.therapistName) {
          setError(result.error ?? "Nu am putut crea invitația.")
          return
        }
        setReady({
          therapistName: result.therapistName,
          inviteLink: result.inviteLink,
          whatsappHref: result.whatsappHref ?? null,
        })
      } catch (caught) {
        if (isForbiddenError(caught) || (caught instanceof Error && caught.message.includes("administrator"))) {
          setError(caught instanceof Error ? caught.message : "Acces interzis (403).")
          return
        }
        setError(caught instanceof Error ? caught.message : "Nu am putut crea invitația.")
      }
    })
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    toast("Linkul de acces a fost copiat.")
    window.setTimeout(() => setCopied(false), 2000)
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
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6">
            {ready ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                    <MessageCircle className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Invitația e gata</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Trimite-i lui {ready.therapistName} linkul pe WhatsApp. La deschidere își confirmă invitația
                      și își alege parola — fără email.
                    </p>
                  </div>
                </div>
                {ready.whatsappHref ? (
                  <a
                    href={ready.whatsappHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-12 min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <MessageCircle className="size-5" />
                    Deschide WhatsApp și trimite invitația
                  </a>
                ) : (
                  <p className="text-sm text-amber-800">
                    Nu am putut construi linkul WhatsApp. Copiază linkul și trimite-l manual.
                  </p>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-xl"
                  onClick={() => void copyLink(ready.inviteLink)}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  Copiază linkul
                </Button>
                <Button type="button" variant="ghost" className="h-11 rounded-xl text-slate-600" onClick={close}>
                  Închide
                </Button>
              </div>
            ) : (
              <form action={handleSubmit}>
                <div className="flex items-start gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-teal-50 text-[#042f2e]">
                    <UserPlus className="size-5" />
                  </span>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Adaugă terapeut</h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Doar nume și telefon. Trimitem invitația pe WhatsApp, fără email.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="invite-therapist_name">Nume complet terapeut</Label>
                    <Input
                      id="invite-therapist_name"
                      name="therapist_name"
                      required
                      className="h-11"
                      placeholder="Andrei Popescu"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="invite-phone">Număr de telefon</Label>
                    <Input
                      id="invite-phone"
                      name="phone"
                      type="tel"
                      required
                      className="h-11"
                      placeholder="07xx xxx xxx"
                    />
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
                          Se creează…
                        </>
                      ) : (
                        "Creează invitația"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
