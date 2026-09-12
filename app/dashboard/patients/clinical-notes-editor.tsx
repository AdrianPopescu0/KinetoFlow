"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { Loader2 } from "lucide-react"

import { saveClinicalNotes, type SaveClinicalNotesPayload, type SaveClinicalNotesResult } from "@/app/dashboard/patients/actions"
import { PatientSaveConflictNotice } from "@/app/dashboard/patients/patient-save-conflict"
import { usePatientFileStamp } from "@/app/dashboard/patients/patient-file-stamp"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toaster"
import type { PatientFileSnapshot } from "@/lib/patients/optimistic"
import { readPatientIdFromRouteOrProps } from "@/lib/patients/patient-id"
import {
  clearClinicalNotesDraft,
  initialClinicalNotes,
  writeClinicalNotesDraft,
} from "@/lib/patients/clinical-notes-draft"

const AUTOSAVE_MS = 5000

export function ClinicalNotesEditor({
  patientId,
  patient_id,
  serverNotes,
  saveAction,
}: {
  patientId?: string | null
  patient_id?: string | null
  serverNotes: string | null
  saveAction?: (payload: SaveClinicalNotesPayload) => Promise<SaveClinicalNotesResult>
}) {
  const params = useParams()
  const pathname = usePathname()
  const resolvedPatientId = readPatientIdFromRouteOrProps({
    patientId,
    patient_id,
    paramsId: params?.id,
    params,
    pathname,
  })
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
    if (!resolvedPatientId) {
      return
    }
    const restored = initialClinicalNotes(resolvedPatientId, serverValue)
    setNotes(restored)
    notesRef.current = restored
    lastWrittenRef.current = restored
    setDraftAt(null)
  }, [resolvedPatientId, serverValue])

  useEffect(() => {
    const id = resolvedPatientId
    if (!id) {
      return
    }
    const timer = window.setInterval(() => {
      const current = notesRef.current
      if (current === lastWrittenRef.current) {
        return
      }
      const draft = writeClinicalNotesDraft(id, current)
      lastWrittenRef.current = current
      setDraftAt(draft.updatedAt)
    }, AUTOSAVE_MS)

    function persistNow() {
      if (!id) {
        return
      }
      const current = notesRef.current
      if (current === lastWrittenRef.current) {
        return
      }
      writeClinicalNotesDraft(id, current)
      lastWrittenRef.current = current
    }

    window.addEventListener("beforeunload", persistNow)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener("beforeunload", persistNow)
      persistNow()
    }
  }, [resolvedPatientId])

  async function saveFinal(forceOverwrite = false) {
    setSaveError(null)
    const routeParamId = params?.id
    const patientKey = readPatientIdFromRouteOrProps({
      patientId,
      patient_id,
      paramsId: routeParamId,
      params,
      pathname,
    })
    if (!patientKey && !saveAction) {
      setSaveError("Pacientul nu a fost găsit.")
      return
    }

    setIsSaving(true)
    if (patientKey) {
      writeClinicalNotesDraft(patientKey, notesRef.current)
      lastWrittenRef.current = notesRef.current
    }

    const payload: SaveClinicalNotesPayload = {
      patient_id: patientKey,
      patientId: patientKey,
      id: patientKey,
      notes: notesRef.current,
      expectedUpdatedAt,
      forceOverwrite,
    }

    try {
      const result = saveAction
        ? await saveAction(payload)
        : await saveClinicalNotes(patientKey as string, payload)

      if (result.unauthorized || result.error?.toLowerCase().includes("expirat")) {
        setSessionExpired(true)
        toast("Sesiunea a expirat. Textul rămâne pe ecran — autentifică-te din nou, apoi salvează.", 8000)
        return
      }

      if (result.conflict && result.current) {
        setConflict(result.current)
        return
      }

      if (result.error) {
        setSaveError(result.error)
        return
      }

      if (typeof result.updated_at === "string") {
        setExpectedUpdatedAt(result.updated_at)
      }

      setSessionExpired(false)
      setConflict(null)
      if (patientKey) {
        clearClinicalNotesDraft(patientKey)
      }
      setDraftAt(null)
      toast("Notițele clinice au fost salvate.")
    } catch {
      setSaveError("Nu am putut salva notițele. Verifică conexiunea — textul nu a fost șters.")
    } finally {
      setIsSaving(false)
    }
  }

  const loginHref = `/login?redirectTo=${encodeURIComponent(`/dashboard/patients/${resolvedPatientId ?? patientId ?? patient_id ?? ""}`)}`

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault()
        void saveFinal(false)
      }}
    >
      <input type="hidden" name="patient_id" value={resolvedPatientId ?? patient_id ?? patientId ?? ""} />
      <input type="hidden" name="patientId" value={resolvedPatientId ?? patientId ?? patient_id ?? ""} />
      {conflict ? (
        <PatientSaveConflictNotice
          pending={isSaving}
          onReload={() => {
            const next = conflict.clinical_notes ?? ""
            setNotes(next)
            notesRef.current = next
            lastWrittenRef.current = next
            if (resolvedPatientId) {
              writeClinicalNotesDraft(resolvedPatientId, next)
            }
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
            : "Notițele sunt salvate și vizibile pentru toți terapeuții din clinică."}
        </p>
        <Button type="submit" disabled={isSaving} className="h-11 rounded-xl">
          {isSaving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se salvează…
            </>
          ) : (
            "Salvează nota"
          )}
        </Button>
      </div>
      {saveError ? (
        <p className="text-sm text-red-700" role="alert">
          {saveError}
        </p>
      ) : null}
    </form>
  )
}
