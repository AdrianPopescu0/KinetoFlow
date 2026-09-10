"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2, Plus, UserPlus } from "lucide-react"

import { inviteTherapistAction } from "@/app/dashboard/echipa/actions"
import { ShareInviteActions } from "@/components/invite/share-invite-actions"
import { isForbiddenError } from "@/lib/http/forbidden"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

type InviteReady = {
  therapistName: string
  inviteLink: string
  phone: string | null
  inviteMessage: string
  whatsappHref: string | null
  whatsappWebHref: string | null
}

export function InviteTherapistDialog({
  triggerLabel = "Adaugă Terapeut",
  triggerClassName,
}: {
  triggerLabel?: string
  triggerClassName?: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState<InviteReady | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isPending, startTransition] = useTransition()

  function close() {
    if (isPending) {
      return
    }
    setOpen(false)
    setError(null)
    setReady(null)
    setCopiedLink(false)
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
          phone: result.phone ?? null,
          inviteMessage: result.inviteMessage ?? "",
          whatsappHref: result.whatsappHref ?? null,
          whatsappWebHref: result.whatsappWebHref ?? null,
        })
        router.refresh()
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
    setCopiedLink(true)
    toast("Linkul de invitație a fost copiat.")
    window.setTimeout(() => setCopiedLink(false), 2000)
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
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="invite-therapist-title"
            className="relative max-h-[90vh] w-full max-w-md min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
          >
            {ready ? (
              <div className="flex min-w-0 flex-col gap-4">
                <div>
                  <h2 id="invite-therapist-title" className="text-lg font-semibold text-slate-800">
                    Link de invitație gata
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Trimite-l lui {ready.therapistName} pe WhatsApp sau SMS. Își alege parola pe
                    link — nu îi creezi contul tu și nu primește un cod pe email.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Link unic</p>
                  <p className="mt-2 break-all text-sm font-medium text-slate-900">{ready.inviteLink}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyLink(ready.inviteLink)}
                    className="mt-4 h-11 rounded-xl"
                  >
                    {copiedLink ? <Check className="size-4" /> : <Copy className="size-4" />}
                    Copiază linkul
                  </Button>
                </div>
                <ShareInviteActions
                  phone={ready.phone}
                  message={ready.inviteMessage || ready.inviteLink}
                  whatsappHref={ready.whatsappHref}
                  whatsappWebHref={ready.whatsappWebHref}
                />
                <Button type="button" variant="outline" onClick={close} className="h-11 w-full rounded-xl">
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
                    <h2 id="invite-therapist-title" className="text-lg font-semibold text-slate-900">
                      Invită terapeut
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      Nume, telefon și email. Generăm un link unic; terapeutul își alege doar
                      parola și intră în clinică, fără onboarding.
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
                    <Label htmlFor="invite-email">Email</Label>
                    <Input
                      id="invite-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="off"
                      className="h-11"
                      placeholder="terapeut@clinica.ro"
                    />
                    <p className="text-xs leading-relaxed text-slate-500">
                      Apare precompletat pe pagina de invitație. Terapeutul își alege doar parola —
                      fără cod pe email — și intră în dashboard.
                    </p>
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
                        "Generează linkul"
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
