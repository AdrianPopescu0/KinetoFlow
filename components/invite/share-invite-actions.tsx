"use client"

import { useState } from "react"
import { Check, Copy, MessageCircle, MessageSquareText } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import { openPatientSms, patientSmsHref } from "@/lib/patients/phone"
import { openExternalWhatsApp, whatsappBlankAnchorProps } from "@/lib/patients/whatsapp"
import { cn } from "@/lib/utils"

const sendActionClassName =
  "h-12 w-full min-w-0 shrink justify-center whitespace-normal px-3 text-center rounded-xl"

export function ShareInviteActions({
  phone,
  message,
  whatsappHref,
  whatsappWebHref,
}: {
  phone: string | null
  message: string
  whatsappHref: string | null
  whatsappWebHref: string | null
}) {
  const [copiedMessage, setCopiedMessage] = useState(false)
  const smsHref = patientSmsHref(phone, message)

  async function copyMessage() {
    if (!message.trim()) {
      return
    }
    await navigator.clipboard.writeText(message)
    setCopiedMessage(true)
    toast("Mesajul a fost copiat. Poți da paste în WhatsApp.")
    window.setTimeout(() => setCopiedMessage(false), 2000)
  }

  const copyButton = message.trim() ? (
    <Button
      type="button"
      variant="outline"
      onClick={() => void copyMessage()}
      className={cn(sendActionClassName, "border-slate-300 text-slate-700")}
    >
      {copiedMessage ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
      {copiedMessage ? "Copiat!" : "Copiază mesajul"}
    </Button>
  ) : null

  if (!whatsappWebHref && !whatsappHref && !smsHref) {
    return (
      <div className="flex flex-col gap-2.5">
        <p className="text-sm text-amber-800">
          Numărul nu a putut fi convertit. Copiază mesajul sau codul și trimite-le manual.
        </p>
        {copyButton}
      </div>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      {whatsappHref ? (
        <a
          {...whatsappBlankAnchorProps(whatsappHref)}
          onClick={(event) => {
            openExternalWhatsApp(event, whatsappHref)
          }}
          className={cn(
            buttonVariants({ variant: "default" }),
            sendActionClassName,
            "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          Deschide WhatsApp
        </a>
      ) : null}
      {whatsappWebHref ? (
        <a
          {...whatsappBlankAnchorProps(whatsappWebHref)}
          onClick={(event) => {
            openExternalWhatsApp(event, whatsappWebHref)
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            sendActionClassName,
            "hidden border-slate-300 text-slate-800 hover:bg-slate-50 md:inline-flex",
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          Deschide pe WhatsApp Web
        </a>
      ) : null}
      {smsHref ? (
        <a
          href={smsHref}
          onClick={(event) => {
            openPatientSms(event, phone, message)
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            sendActionClassName,
            "border-slate-300 text-slate-800 hover:bg-slate-50",
          )}
        >
          <MessageSquareText className="size-4 shrink-0" />
          Trimite SMS
        </a>
      ) : null}
      {copyButton}
    </div>
  )
}
