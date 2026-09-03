"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Pencil, Trash2 } from "lucide-react"

import { deletePatient, updatePatient } from "@/app/dashboard/patients/actions"
import { PatientSaveConflictNotice } from "@/app/dashboard/patients/patient-save-conflict"
import { usePatientFileStamp } from "@/app/dashboard/patients/patient-file-stamp"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/toaster"
import type { PatientFileSnapshot } from "@/lib/patients/optimistic"
import type { PatientRecord } from "@/lib/patients/types-db"

export function PatientFileActions({ patient }: { patient: PatientRecord }) {
  const router = useRouter()
  const { expectedUpdatedAt, setExpectedUpdatedAt } = usePatientFileStamp()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState<PatientFileSnapshot | null>(null)
  const [isPending, startTransition] = useTransition()
  const [fullName, setFullName] = useState(patient.full_name)
  const [phone, setPhone] = useState(patient.phone ?? "")
  const [email, setEmail] = useState(patient.email ?? "")
  const [diagnosis, setDiagnosis] = useState(patient.diagnosis ?? "")

  useEffect(() => {
    if (open) {
      return
    }
    setFullName(patient.full_name)
    setPhone(patient.phone ?? "")
    setEmail(patient.email ?? "")
    setDiagnosis(patient.diagnosis ?? "")
  }, [patient, open])

  function applySnapshot(snapshot: PatientFileSnapshot) {
    setFullName(snapshot.full_name)
    setPhone(snapshot.phone ?? "")
    setEmail(snapshot.email ?? "")
    setDiagnosis(snapshot.diagnosis ?? "")
    setExpectedUpdatedAt(snapshot.updated_at)
    setConflict(null)
    toast("Am încărcat versiunea salvată în baza de date.")
  }

  function save(formData: FormData, forceOverwrite = false) {
    setError(null)
    formData.set("expected_updated_at", expectedUpdatedAt ?? "")
    if (forceOverwrite) {
      formData.set("force_overwrite", "1")
    }
    startTransition(async () => {
      const result = await updatePatient(patient.id, formData)
      if (result.conflict && result.current) {
        setConflict(result.current)
        return
      }
      if (result.error) {
        setError(result.error)
        if (result.error.toLowerCase().includes("expirat")) {
          toast("Sesiunea a expirat. Datele din formular rămân pe ecran.", 8000)
        }
        return
      }
      if (result.updatedAt) {
        setExpectedUpdatedAt(result.updatedAt)
      }
      toast("Fișa pacientului a fost actualizată.")
      setConflict(null)
      setOpen(false)
      router.refresh()
    })
  }

  function remove() {
    if (!window.confirm(`Ștergi fișa lui ${patient.full_name}? Acțiunea nu poate fi anulată.`)) {
      return
    }
    startTransition(async () => {
      try {
        const result = await deletePatient(patient.id)
        if (result.error) {
          alert(result.error)
          return
        }
        router.push("/dashboard/patients")
        router.refresh()
      } catch (error) {
        alert(error instanceof Error ? error.message : String(error))
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="h-11 rounded-xl">
        <Pencil className="size-4" />
        Editează
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={remove}
        disabled={isPending}
        className="h-11 rounded-xl border-red-200 text-red-700 hover:bg-red-50"
      >
        {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
        Șterge
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Închide"
            onClick={() => !isPending && setOpen(false)}
          />
          <form
            action={(formData) => save(formData, false)}
            className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 shadow-lg"
          >
            <h2 className="text-lg font-semibold text-slate-800">Editează pacientul</h2>
            <div className="mt-4 flex flex-col gap-4">
              {conflict ? (
                <PatientSaveConflictNotice
                  pending={isPending}
                  onReload={() => applySnapshot(conflict)}
                  onOverwrite={() => {
                    const formData = new FormData()
                    formData.set("full_name", fullName)
                    formData.set("phone", phone)
                    formData.set("email", email)
                    formData.set("diagnosis", diagnosis)
                    save(formData, true)
                  }}
                />
              ) : null}
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-full_name">Nume</Label>
                <Input
                  id="edit-full_name"
                  name="full_name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-phone">Telefon</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    required
                    className="h-11"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="edit-email">Email (opțional)</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="edit-diagnosis">Diagnostic</Label>
                <Input
                  id="edit-diagnosis"
                  name="diagnosis"
                  value={diagnosis}
                  onChange={(event) => setDiagnosis(event.target.value)}
                  className="h-11"
                />
              </div>
              {error ? <p className="text-sm text-red-700">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} className="h-11 rounded-xl">
                  Anulează
                </Button>
                <Button type="submit" disabled={isPending} className="h-11 rounded-xl">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvează"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
