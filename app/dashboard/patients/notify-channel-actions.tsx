"use client"

import { useState } from "react"
import { MessageCircle, MessageSquareText } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import { notifyChannelLabel, type PatientNotifyChannel } from "@/lib/patients/notify-channel"
import { openPatientSms, patientSmsHref } from "@/lib/patients/phone"
import { openExternalWhatsApp, whatsappBlankAnchorProps } from "@/lib/patients/whatsapp"
import { cn } from "@/lib/utils"

type NotifyChannelActionsProps = {
  patientId: string
  phone: string | null
  message: string
  whatsappHref: string | null
  whatsappWebHref: string | null
  initialChannel?: PatientNotifyChannel | null
}

export function NotifyChannelActions({
  patientId,
  phone,
  message,
  whatsappHref,
  whatsappWebHref,
  initialChannel = null,
}: NotifyChannelActionsProps) {
  const [channel, setChannel] = useState<PatientNotifyChannel | null>(initialChannel)
  const smsHref = patientSmsHref(phone, message)
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
      // Canalul rămâne setat local; trimiterea e click-to-chat, nu API.
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      <p className="text-sm text-slate-600">
        Trimite invitația pe WhatsApp sau prin SMS. Aplicația reține canalul ales (
        <span className="font-medium text-slate-800">{notifyChannelLabel(channel)}</span>
        ). Reminder-ele de check-in rămân pe notificări push.
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
          Deschide WhatsApp
        </a>
      ) : null}
      {whatsappWebHref ? (
        <a
          {...whatsappBlankAnchorProps(whatsappWebHref)}
          onClick={(event) => {
            openExternalWhatsApp(event, whatsappWebHref)
            void remember("whatsapp")
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
            void remember("sms")
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
    </div>
  )
}
