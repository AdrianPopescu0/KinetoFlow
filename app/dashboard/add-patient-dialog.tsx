"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Check, Copy, Loader2, Plus } from "lucide-react"

import { createPatient } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import { NotifyChannelActions } from "@/app/dashboard/patients/notify-channel-actions"
import { cn } from "@/lib/utils"

type CreatedPatient = {
  patientId: string
  fullName: string
  accessCode: string
  portalUrl: string
  phone: string | null
  whatsappHref: string | null
  whatsappWebHref: string | null
  whatsappMessage: string
}

const sendActionClassName =
  "h-12 w-full min-w-0 shrink justify-center whitespace-normal px-3 text-center"

export function AddPatientDialog() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [created, setCreated] = useState<CreatedPatient | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedMessage, setCopiedMessage] = useState(false)

  function reset() {
    setOpen(false)
    setCreated(null)
    setError(null)
    setCopiedCode(false)
    setCopiedMessage(false)
  }

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createPatient(formData)
      if (result.error || !result.token || !result.accessCode || !result.fullName) {
        setError(result.error ?? "Nu am putut salva pacientul.")
        return
      }

      const formPhone = typeof formData.get("phone") === "string" ? String(formData.get("phone")) : null
      const payload: CreatedPatient = {
        patientId: result.patientId ?? "",
        fullName: result.fullName,
        accessCode: result.accessCode,
        portalUrl: result.portalUrl ?? "",
        phone: result.phone ?? formPhone,
        whatsappHref: result.whatsappHref ?? null,
        whatsappWebHref: result.whatsappWebHref ?? null,
        whatsappMessage: result.whatsappMessage ?? "",
      }
      setCreated(payload)
      router.refresh()
    })
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code)
    setCopiedCode(true)
    toast("Codul de acces a fost copiat.")
    window.setTimeout(() => setCopiedCode(false), 2000)
  }

  async function copyMessage(message: string) {
    await navigator.clipboard.writeText(message)
    setCopiedMessage(true)
    toast("Mesajul a fost copiat. Poți da paste în WhatsApp Web.")
    window.setTimeout(() => setCopiedMessage(false), 2000)
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError(null)
          setCreated(null)
          setOpen(true)
        }}
        className="h-12 min-h-[48px] rounded-xl px-4"
      >
        <Plus className="size-4" />
        Adaugă Pacient
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Închide"
            onClick={() => !isPending && reset()}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-patient-title"
            className="relative max-h-[90vh] w-full max-w-md min-w-0 overflow-x-hidden overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
          >
            {created ? (
              <div className="flex min-w-0 flex-col gap-4">
                <div>
                  <h2 id="add-patient-title" className="text-lg font-semibold text-slate-800">
                    Pacient adăugat
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {created.fullName} poate intra în aplicație cu telefonul și acest cod.
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cod unic de acces</p>
                  <p className="mt-2 font-mono text-4xl font-semibold tracking-[0.2em] text-slate-900">
                    {created.accessCode}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => copyCode(created.accessCode)}
                    className="mt-4 h-11 rounded-xl"
                  >
                    {copiedCode ? <Check className="size-4" /> : <Copy className="size-4" />}
                    Copiază codul
                  </Button>
                </div>
                {created.portalUrl ? (
                  <p className="break-all text-center text-xs text-slate-500">{created.portalUrl}</p>
                ) : null}
                {created.patientId && (created.whatsappWebHref || created.whatsappHref || created.phone) ? (
                  <div className="flex w-full min-w-0 flex-col gap-2.5">
                    <NotifyChannelActions
                      patientId={created.patientId}
                      phone={created.phone}
                      message={created.whatsappMessage || created.portalUrl}
                      whatsappHref={created.whatsappHref}
                      whatsappWebHref={created.whatsappWebHref}
                    />
                    {created.whatsappMessage ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyMessage(created.whatsappMessage)}
                        className={cn(sendActionClassName, "rounded-xl border-slate-300 text-slate-700")}
                      >
                        {copiedMessage ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                        {copiedMessage ? "Copiat!" : "Copiază mesajul"}
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    <p className="text-sm text-amber-800">
                      Numărul nu a putut fi convertit. Copiază mesajul sau codul și trimite-le manual.
                    </p>
                    {created.whatsappMessage ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => copyMessage(created.whatsappMessage)}
                        className={cn(sendActionClassName, "rounded-xl")}
                      >
                        {copiedMessage ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                        {copiedMessage ? "Copiat!" : "Copiază mesajul"}
                      </Button>
                    ) : null}
                  </div>
                )}
                <Button type="button" variant="outline" onClick={reset} className="h-11 w-full rounded-xl">
                  Închide
                </Button>
              </div>
            ) : (
              <>
                <h2 id="add-patient-title" className="text-lg font-semibold text-slate-800">
                  Adaugă pacient
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Telefonul e obligatoriu. Generăm un cod de 8 cifre pe care îl trimiți pe WhatsApp sau prin SMS.
                </p>

                <form action={handleSubmit} className="mt-5 flex flex-col gap-4">
                  <Field id="full_name" label="Nume" required placeholder="Ana Popescu" disabled={isPending} />
                  <Field
                    id="phone"
                    label="Telefon"
                    required
                    placeholder="07xx xxx xxx"
                    disabled={isPending}
                    type="tel"
                  />
                  <Field
                    id="email"
                    label="Email (opțional)"
                    placeholder="ana@email.ro"
                    disabled={isPending}
                    type="email"
                  />
                  <Field id="diagnosis" label="Diagnostic" placeholder="Tendinopatie de umăr" disabled={isPending} />
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="clinical_notes">Note clinice</Label>
                    <Textarea
                      id="clinical_notes"
                      name="clinical_notes"
                      disabled={isPending}
                      placeholder="Obiective, precauții, observații..."
                      className="min-h-20 rounded-xl border-slate-300"
                    />
                  </div>

                  {error ? (
                    <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                      {error}
                    </p>
                  ) : null}

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="outline" disabled={isPending} onClick={reset} className="h-11 rounded-xl">
                      Anulează
                    </Button>
                    <Button type="submit" disabled={isPending} className="h-11 rounded-xl">
                      {isPending ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Se salvează…
                        </>
                      ) : (
                        "Salvează"
                      )}
                    </Button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}

function Field({
  id,
  label,
  required,
  placeholder,
  disabled,
  type = "text",
}: {
  id: string
  label: string
  required?: boolean
  placeholder?: string
  disabled?: boolean
  type?: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </Label>
      <Input
        id={id}
        name={id}
        type={type}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        className="h-11 border-slate-300"
      />
    </div>
  )
}
