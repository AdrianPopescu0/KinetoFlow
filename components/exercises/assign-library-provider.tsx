"use client"

import { createContext, useContext, useMemo, useState, type ReactNode } from "react"

import {
  seedAssignCatalogCache,
  seedAssignProtocolsCache,
} from "@/lib/exercises/assign-catalog-cache"
import type { LibraryExercise } from "@/lib/exercises/types"
import type { TrainingProtocol } from "@/lib/protocols/types"

type AssignLibraryContextValue = {
  catalog: LibraryExercise[]
  protocols: TrainingProtocol[]
  upsertLibraryExercise: (exercise: LibraryExercise) => void
  replaceProtocols: (protocols: TrainingProtocol[]) => void
  upsertProtocol: (protocol: TrainingProtocol) => void
  removeProtocol: (id: string) => void
}

const AssignLibraryContext = createContext<AssignLibraryContextValue | null>(null)

export function AssignLibraryProvider({
  catalog: initialCatalog,
  protocols: initialProtocols,
  children,
}: {
  catalog: LibraryExercise[]
  protocols: TrainingProtocol[]
  children: ReactNode
}) {
  const [catalog, setCatalog] = useState(initialCatalog)
  const [protocols, setProtocols] = useState(initialProtocols)

  // Seed sync module cache so modal/getters citesc instant, fără fetch.
  seedAssignCatalogCache(catalog)
  seedAssignProtocolsCache(protocols)

  const value = useMemo<AssignLibraryContextValue>(
    () => ({
      catalog,
      protocols,
      upsertLibraryExercise(exercise) {
        setCatalog((current) => {
          const next = [exercise, ...current.filter((item) => item.id !== exercise.id)]
          seedAssignCatalogCache(next)
          return next
        })
      },
      replaceProtocols(next) {
        const filtered = next.filter((item) => item.exercises.length > 0)
        seedAssignProtocolsCache(filtered)
        setProtocols(filtered)
      },
      upsertProtocol(protocol) {
        setProtocols((current) => {
          const next = [protocol, ...current.filter((item) => item.id !== protocol.id)].filter(
            (item) => item.exercises.length > 0,
          )
          seedAssignProtocolsCache(next)
          return next
        })
      },
      removeProtocol(id) {
        setProtocols((current) => {
          const next = current.filter((item) => item.id !== id)
          seedAssignProtocolsCache(next)
          return next
        })
      },
    }),
    [catalog, protocols],
  )

  return <AssignLibraryContext.Provider value={value}>{children}</AssignLibraryContext.Provider>
}

export function useAssignLibrary(): AssignLibraryContextValue {
  const value = useContext(AssignLibraryContext)
  if (!value) {
    throw new Error("useAssignLibrary trebuie folosit în interiorul AssignLibraryProvider.")
  }
  return value
}

/** Variantă sigură când provider-ul poate lipsi (teste / edge). */
export function useAssignLibraryOptional(): AssignLibraryContextValue | null {
  return useContext(AssignLibraryContext)
}
