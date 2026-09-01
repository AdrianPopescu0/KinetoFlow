"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus } from "lucide-react"

import { createPatient } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"

export function AddPatientDialog() {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createPatient(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      toast("Pacientul a fost adăugat. Linkul de acces este gata de copiat.")
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        type="button"
        onClick={() => {
          setError(null)
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
            aria-label="Închide formularul"
            onClick={() => !isPending && setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-patient-title"
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
          >
            <h2 id="add-patient-title" className="text-lg font-semibold text-slate-800">
              Adaugă pacient
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Generăm automat un token unic pentru accesul fără parolă.
            </p>

            <form action={handleSubmit} className="mt-5 flex flex-col gap-4">
              <Field id="full_name" label="Nume" required placeholder="Ana Popescu" disabled={isPending} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="phone" label="Telefon" placeholder="07xx xxx xxx" disabled={isPending} />
                <Field id="email" label="Email" type="email" placeholder="ana@email.ro" disabled={isPending} />
              </div>
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
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => setOpen(false)}
                  className="h-11 rounded-xl"
                >
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
      <Label htmlFor={id}>{label}</Label>
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
