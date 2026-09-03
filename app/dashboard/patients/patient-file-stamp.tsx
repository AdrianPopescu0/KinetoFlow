"use client"

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

type StampContextValue = {
  expectedUpdatedAt: string | null
  setExpectedUpdatedAt: (value: string | null) => void
}

const StampContext = createContext<StampContextValue | null>(null)

export function PatientFileStampProvider({
  initialUpdatedAt,
  children,
}: {
  initialUpdatedAt: string | null
  children: ReactNode
}) {
  const [expectedUpdatedAt, setExpectedUpdatedAt] = useState<string | null>(initialUpdatedAt)

  useEffect(() => {
    setExpectedUpdatedAt(initialUpdatedAt)
  }, [initialUpdatedAt])
  const value = useMemo(
    () => ({ expectedUpdatedAt, setExpectedUpdatedAt }),
    [expectedUpdatedAt],
  )
  return <StampContext.Provider value={value}>{children}</StampContext.Provider>
}

export function usePatientFileStamp() {
  const context = useContext(StampContext)
  if (!context) {
    throw new Error("usePatientFileStamp must be used within PatientFileStampProvider")
  }
  return context
}
