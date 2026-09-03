"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { PatientSaveConflictNotice } from "@/app/dashboard/patients/patient-save-conflict"
import { usePatientFileStamp } from "@/app/dashboard/patients/patient-file-stamp"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import type { PatientFileSnapshot } from "@/lib/patients/optimistic"
import {
  clearClinicalNotesDraft,
  initialClinicalNotes,
  writeClinicalNotesDraft,
} from "@/lib/patients/clinical-notes-draft"

const AUTOSAVE_MS = 5000

export function ClinicalNotesEditor({
  patientId,
  serverNotes,
}: {
  patientId: string
  serverNotes: string | null
}) {
  const serverValue = serverNotes ?? ""
  const [notes, setNotes] = useState(serverValue)
  const [draftAt, setDraftAt] = useState<number | null>(null)
  const { expectedUpdatedAt, setExpectedUpdatedAt } = usePatientFileStamp()
  const [conflict, setConflict] = useState<PatientFileSnapshot | null>(null)
  const [sessionExpired, setSessionExpired] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const notesRef = useRef(notes)
  notesRef.current = notes
  const lastWrittenRef = useRef(serverValue)

  useEffect(() => {
    const restored = initialClinicalNotes(patientId, serverValue)
    setNotes(restored)
    notesRef.current = restored
    lastWrittenRef.current = restored
    if (restored !== serverValue) {
      setDraftAt(Date.now())
    }
  }, [patientId, serverValue])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = notesRef.current
      if (current === lastWrittenRef.current) {
        return
      }
      const draft = writeClinicalNotesDraft(patientId, current)
      lastWrittenRef.current = current
      setDraftAt(draft.updatedAt)
    }, AUTOSAVE_MS)

    function persistNow() {
      const current = notesRef.current
      if (current === lastWrittenRef.current) {
        return
      }
      writeClinicalNotesDraft(patientId, current)
      lastWrittenRef.current = current
    }

    window.addEventListener("beforeunload", persistNow)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("beforeunload", persistNow)
      persistNow()
    }
  }, [patientId])

  async function saveFinal(forceOverwrite = false) {
    setSaveError(null)
    setIsSaving(true)
    writeClinicalNotesDraft(patientId, notesRef.current)
    lastWrittenRef.current = notesRef.current

    try {
      const response = await fetch(`/api/patients/${patientId}/clinical-notes`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          notes: notesRef.current,
          expectedUpdatedAt,
          forceOverwrite,
        }),
      })

      if (response.status === 401 || response.redirected) {
        setSessionExpired(true)
        toast("Sesiunea a expirat. Textul rămâne pe ecran — autentifică-te din nou, apoi salvează.", 8000)
        return
      }

      if (response.status === 409) {
        const payload = (await response.json().catch(() => null)) as
          | { current?: PatientFileSnapshot }
          | null
        if (payload?.current) {
          setConflict(payload.current)
        }
        return
      }

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        setSaveError(payload?.error ?? "Nu am putut salva notițele.")
        return
      }

      const saved = (await response.json().catch(() => null)) as { updated_at?: string | null } | null
      if (typeof saved?.updated_at === "string") {
        setExpectedUpdatedAt(saved.updated_at)
      }

      setSessionExpired(false)
      setConflict(null)
      clearClinicalNotesDraft(patientId)
      setDraftAt(null)
      toast("Notițele clinice au fost salvate.")
    } catch {
      setSaveError("Nu am putut salva notițele. Verifică conexiunea — textul nu a fost șters.")
    } finally {
      setIsSaving(false)
    }
  }

  const loginHref = `/login?redirectTo=${encodeURIComponent(`/dashboard/patients/${patientId}`)}`

  return (
    <div className="flex flex-col gap-3">
      {conflict ? (
        <PatientSaveConflictNotice
          pending={isSaving}
          onReload={() => {
            const next = conflict.clinical_notes ?? ""
            setNotes(next)
            notesRef.current = next
            lastWrittenRef.current = next
            writeClinicalNotesDraft(patientId, next)
            setExpectedUpdatedAt(conflict.updated_at)
            setConflict(null)
            toast("Am încărcat notițele salvate în baza de date.")
          }}
          onOverwrite={() => void saveFinal(true)}
        />
      ) : null}

      {sessionExpired ? (
        <Alert variant="destructive" className="border-amber-200 bg-amber-50 text-amber-950">
          <AlertTitle>Sesiunea a expirat</AlertTitle>
          <AlertDescription className="text-amber-900">
            Autentifică-te din nou ca să salvezi pe server. Notițele rămân aici și în draft-ul local.{" "}
            <Link
              href={loginHref}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[#042f2e] underline underline-offset-2"
            >
              Deschide autentificarea
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <Textarea
        id="treatment-notes"
        value={notes}
        onChange={(event) => {
          setNotes(event.target.value)
          setSaveError(null)
        }}
        placeholder="Obiective, precauții, evoluție, plan de tratament…"
        className="min-h-40 rounded-xl border-slate-300 bg-white"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {draftAt
            ? `Draft salvat local la ${new Date(draftAt).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}.`
            : "Draft-ul se salvează automat la fiecare 5 secunde pe acest dispozitiv."}
        </p>
        <Button type="button" onClick={() => void saveFinal(false)} disabled={isSaving} className="h-11 rounded-xl">
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se salvează…
            </>
          ) : (
            "Salvează pe server"
          )}
        </Button>
      </div>
      {saveError ? (
        <p className="text-sm text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}
    </div>
  )
}
