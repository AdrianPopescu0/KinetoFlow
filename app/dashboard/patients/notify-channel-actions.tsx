"use client"

import { useState } from "react"
import { MessageCircle, MessageSquareText } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import { notifyChannelLabel, type PatientNotifyChannel } from "@/lib/patients/notify-channel"
import { openPatientSms, patientSmsHref } from "@/lib/patients/phone"
import { openExternalWhatsApp, patientWhatsAppMeHref, whatsappBlankAnchorProps } from "@/lib/patients/whatsapp"
import { cn } from "@/lib/utils"

type NotifyChannelActionsProps = {
  patientId: string
  phone: string | null
  initialChannel?: PatientNotifyChannel | null
}

export function NotifyChannelActions({
  patientId,
  phone,
  initialChannel = null,
}: NotifyChannelActionsProps) {
  const [channel, setChannel] = useState<PatientNotifyChannel | null>(initialChannel)
  const whatsappHref = patientWhatsAppMeHref(phone)
  const smsHref = patientSmsHref(phone)
  const sendActionClassName =
    "h-12 w-full min-w-0 shrink justify-center whitespace-normal px-3 text-center rounded-xl"

  async function remember(next: PatientNotifyChannel) {
    setChannel(next)
    try {
      const response = await fetch("/api/patients/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, channel: next, rememberOnly: true }),
      })
      const data = (await response.json()) as { saved?: boolean; missingColumn?: boolean }
      if (data.saved) {
        toast(`Canal salvat: ${notifyChannelLabel(next)}.`)
        return
      }
      if (data.missingColumn) {
        toast("Rulează sql/022_patient_notify_channel.sql în Supabase ca să salvăm canalul.")
      }
    } catch {
      // Canalul rămâne setat local; deschiderea e click-to-chat, nu API.
    }
  }

  if (!whatsappHref && !smsHref) {
    return (
      <p className="text-sm text-slate-600">
        Adaugă un număr de telefon pe fișă ca să deschizi WhatsApp sau SMS.
      </p>
    )
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      <p className="text-sm text-slate-600">
        Deschide conversația pe WhatsApp sau SMS, doar cu numărul pacientului. Aplicația reține
        canalul ales (
        <span className="font-medium text-slate-800">{notifyChannelLabel(channel)}</span>
        ).
      </p>
      {whatsappHref ? (
        <a
          {...whatsappBlankAnchorProps(whatsappHref)}
          onClick={(event) => {
            openExternalWhatsApp(event, whatsappHref)
            void remember("whatsapp")
          }}
          className={cn(
            buttonVariants({ variant: "default" }),
            sendActionClassName,
            "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          WhatsApp
        </a>
      ) : null}
      {smsHref ? (
        <a
          href={smsHref}
          onClick={(event) => {
            void remember("sms")
            openPatientSms(event, phone)
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            sendActionClassName,
            "border-slate-300 text-slate-800 hover:bg-slate-50",
          )}
        >
          <MessageSquareText className="size-4 shrink-0" />
          SMS
        </a>
      ) : null}
    </div>
  )
}
