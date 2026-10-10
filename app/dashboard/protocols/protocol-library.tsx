"use client"

import { useCallback, useMemo, useState, useTransition } from "react"
import dynamic from "next/dynamic"
import { Pencil, Search, Trash2 } from "lucide-react"

import { deleteTrainingProtocol } from "@/app/dashboard/protocols/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toaster"
import { useAssignLibraryOptional } from "@/components/exercises/assign-library-provider"
import { difficultyLabel, regionLabels } from "@/lib/exercises/taxonomy"
import type { AnatomicalRegion, Difficulty, LibraryExercise } from "@/lib/exercises/types"
import type { TrainingProtocol } from "@/lib/protocols/types"

const ProtocolEditorDialog = dynamic(
  () =>
    import("@/app/dashboard/protocols/add-protocol-dialog").then((mod) => ({
      default: mod.ProtocolEditorDialog,
    })),
  { ssr: false },
)

function isRegion(value: string | null): value is AnatomicalRegion {
  return (
    value === "cervical" ||
    value === "thoracic" ||
    value === "lumbar" ||
    value === "pelvis" ||
    value === "upper" ||
    value === "lower"
  )
}

function isDifficulty(value: string | null): value is Difficulty {
  return value === "usor" || value === "mediu" || value === "avansat"
}

export function ProtocolLibrary({
  initialProtocols,
  catalog,
}: {
  initialProtocols: TrainingProtocol[]
  catalog: LibraryExercise[]
}) {
  const assignLibrary = useAssignLibraryOptional()
  const [protocols, setProtocols] = useState(initialProtocols)
  const [query, setQuery] = useState("")
  const [editor, setEditor] = useState<"create" | TrainingProtocol | null>(null)
  const [, startDelete] = useTransition()

  const visible = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("ro-RO")
    if (!needle) {
      return protocols
    }
    return protocols.filter((protocol) => {
      const haystack = [
        protocol.title,
        protocol.description ?? "",
        protocol.notes ?? "",
        ...protocol.exercises.map((item) => item.title),
      ]
        .join(" ")
        .toLocaleLowerCase("ro-RO")
      return haystack.includes(needle)
    })
  }, [protocols, query])

  const onSaved = useCallback((protocol: TrainingProtocol) => {
    assignLibrary?.upsertProtocol(protocol)
    setProtocols((current) => {
      const without = current.filter((item) => item.id !== protocol.id)
      return [protocol, ...without]
    })
  }, [assignLibrary])

  const removeProtocol = useCallback((id: string) => {
    startDelete(async () => {
      const result = await deleteTrainingProtocol(id)
      if (result.error) {
        toast(result.error)
        return
      }
      assignLibrary?.removeProtocol(id)
      setProtocols((current) => current.filter((item) => item.id !== id))
      toast("Protocolul a fost șters.")
    })
  }, [assignLibrary])

  return (
    <div className="flex w-full max-w-full flex-1 flex-col overflow-x-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Bibliotecă de protocoale de antrenament
        </h1>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="max-w-xl text-sm text-slate-600">
            Șabloane de exerciții din bibliotecă. La atribuirea pe pacient, imporți tot protocolul dintr-o dată — fără
            săptămâni.
          </p>
          <Button type="button" onClick={() => setEditor("create")} className="h-11 shrink-0 rounded-xl">
            Adaugă protocol nou
          </Button>
        </div>
      </div>

      <div className="relative mt-6 min-w-0">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Caută protocol sau exercițiu…"
          className="h-12 w-full rounded-xl pl-11 text-base"
          aria-label="Caută protocoale"
        />
      </div>

      {visible.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-base font-medium text-slate-900">
            {protocols.length === 0 ? "Niciun protocol încă" : "Niciun rezultat"}
          </p>
          <p className="mt-2 text-sm text-slate-600">
            {protocols.length === 0
              ? "Creează un protocol și alege exercițiile din bibliotecă."
              : "Încearcă un alt termen de căutare."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((protocol) => (
            <li
              key={protocol.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">{protocol.title}</h2>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-xl"
                    aria-label={`Editează ${protocol.title}`}
                    onClick={() => setEditor(protocol)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 rounded-xl"
                    aria-label={`Șterge ${protocol.title}`}
                    onClick={() => removeProtocol(protocol.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {protocol.description ? (
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">{protocol.description}</p>
              ) : null}
              <dl className="mt-4 flex flex-wrap gap-2 text-xs">
                <div className="rounded-full bg-teal-50 px-2.5 py-1 font-medium text-teal-900">
                  {protocol.exercises.length}{" "}
                  {protocol.exercises.length === 1 ? "exercițiu" : "exerciții"}
                </div>
                {isRegion(protocol.region) ? (
                  <div className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    {regionLabels([protocol.region])}
                  </div>
                ) : null}
                {isDifficulty(protocol.difficulty) ? (
                  <div className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                    {difficultyLabel(protocol.difficulty)}
                  </div>
                ) : null}
              </dl>
              {protocol.exercises.length > 0 ? (
                <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
                  {protocol.exercises.slice(0, 4).map((exercise) => (
                    <li key={exercise.id} className="truncate text-xs text-slate-600">
                      · {exercise.title}
                      {exercise.sets != null && exercise.reps != null
                        ? ` (${exercise.sets}×${exercise.reps})`
                        : ""}
                    </li>
                  ))}
                  {protocol.exercises.length > 4 ? (
                    <li className="text-xs text-slate-500">+ încă {protocol.exercises.length - 4}</li>
                  ) : null}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      {editor ? (
        <ProtocolEditorDialog
          mode={editor === "create" ? "create" : "edit"}
          catalog={catalog}
          initial={editor === "create" ? null : editor}
          onClose={() => setEditor(null)}
          onSaved={onSaved}
        />
      ) : null}
    </div>
  )
}
