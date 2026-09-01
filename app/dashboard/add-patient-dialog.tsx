"use client"

import { useState, useTransition } from "react"
import { Loader2, Plus } from "lucide-react"

import { createPatient } from "@/app/dashboard/patients/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
        Adaugă Pacient Nou
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
            className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:p-6"
          >
            <h2 id="add-patient-title" className="text-lg font-semibold text-slate-800">
              Pacient nou
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Se generează automat un link de acces fără parolă, pe baza tokenului unic.
            </p>

            <form action={handleSubmit} className="mt-5 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="full_name">Nume complet</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  disabled={isPending}
                  placeholder="Ana Popescu"
                  className="h-11 border-slate-300"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="diagnosis">Diagnostic</Label>
                <Input
                  id="diagnosis"
                  name="diagnosis"
                  disabled={isPending}
                  placeholder="Tendinopatie de umăr"
                  className="h-11 border-slate-300"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    disabled={isPending}
                    placeholder="ana@email.ro"
                    className="h-11 border-slate-300"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    disabled={isPending}
                    placeholder="07xx xxx xxx"
                    className="h-11 border-slate-300"
                  />
                </div>
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
                  className="h-11 min-h-[44px] rounded-xl"
                >
                  Anulează
                </Button>
                <Button type="submit" disabled={isPending} className="h-11 min-h-[44px] rounded-xl">
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se salvează…
                    </>
                  ) : (
                    "Salvează pacientul"
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
