"use client"

import { useState } from "react"
import { MessageCircle, MessageSquareText } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { toast } from "@/components/ui/toaster"
import { notifyChannelLabel, type PatientNotifyChannel } from "@/lib/patients/notify-channel"
import { openPatientSms, patientSmsHref } from "@/lib/patients/phone"
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
    try {
      const response = await fetch("/api/patients/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, channel: next }),
      })
      const data = (await response.json()) as { saved?: boolean; missingColumn?: boolean }
      setChannel(next)
      if (data.saved) {
        toast(
          next === "whatsapp"
            ? "Canal salvat: WhatsApp. Reminder-ele vor folosi WhatsApp."
            : "Canal salvat: SMS. Reminder-ele vor folosi SMS.",
        )
        return
      }
      if (data.missingColumn) {
        toast("Rulează sql/022_patient_notify_channel.sql în Supabase ca să salvăm canalul.")
      }
    } catch {
      setChannel(next)
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-2.5">
      <p className="text-sm text-slate-600">
        Trimite invitația pe WhatsApp sau prin SMS. Aplicația reține canalul ales (
        <span className="font-medium text-slate-800">{notifyChannelLabel(channel)}</span>
        ) și îl folosește la reminder-ele de check-in.
      </p>
      {whatsappWebHref ? (
        <a
          href={whatsappWebHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void remember("whatsapp")
          }}
          className={cn(
            buttonVariants({ variant: "default" }),
            sendActionClassName,
            "bg-emerald-600 text-white hover:bg-emerald-700",
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          Deschide pe WhatsApp Web
        </a>
      ) : null}
      {whatsappHref ? (
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            void remember("whatsapp")
          }}
          className={cn(
            buttonVariants({ variant: "outline" }),
            sendActionClassName,
            "border-emerald-600 text-emerald-800 hover:bg-emerald-50",
          )}
        >
          <MessageCircle className="size-4 shrink-0" />
          Deschide în Aplicație
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
